
import { RegisterParticipantRequest } from 'common/types/api/auth'
import prisma from './PrismaClient'
import { checkPasswordStrength } from 'common/src/PasswordStrength';
import { ParticipantType, Role } from '@prisma/client';
import { generateToken, hashPassword } from './authentication';
import { ValidateError } from 'tsoa';
import { createDefaultAnswers } from 'common/src/surveys/createDefaultAnswers';

export async function createParticipant(
    bodyRequest: RegisterParticipantRequest, 
    userRepo: typeof prisma.user, 
    surveyRepo: typeof prisma.surveyVersion,
    profileRepo: typeof prisma.participantProfile,
    spRepo: typeof prisma.surveyParticipant
) {
    const { password, ...participantData } = bodyRequest;
  
    // Check Password
    const { isValid, fields } = await checkPasswordStrength(password);
    if (!isValid) {
      throw new ValidateError(fields, 'Password does not meet strength requirements');
    }
  
    const hashedPassword = await hashPassword(password);
  
    // Extract user and profile data
    const { firstName, middleName, lastName, email, dob, ...profileData } = participantData;
    const userDetails = { firstName, middleName, lastName, email };
  
    const { nextOfKin, dependents, ...noNextOfKinProfileData } = profileData;
    const nextOfKinCreateData = { nextOfKin: { create: { ...nextOfKin } } };
  
    // Create User
    const data = {
      ...userDetails,
      role: Role.Participant,
      password: hashedPassword,
    };
    const insertedUser = await userRepo.create({ data });
  
    // Check for existing dependents
    let familyId;
    if (dependents.length > 0) {
      const existingDep = await profileRepo.findFirst({
        where: {
          firstName: dependents[0].firstName,
          lastName: dependents[0].lastName,
          dob: new Date(dependents[0].dob),
        },
      });
      if (existingDep) {
        familyId = existingDep.familyId;
      }
    }
  
    // Create Profile
    const profile = await profileRepo.create({
      data: {
        userId: insertedUser.id,
        ...noNextOfKinProfileData,
        ...nextOfKinCreateData,
        firstName: insertedUser.firstName,
        lastName: insertedUser.lastName,
        dob: new Date(dob),
        familyId,
        participantType: dependents.length > 0 ? ParticipantType.GUARDIAN : ParticipantType.STANDARD,
      },
    });
  
    // Fetch current survey
    const currentSurvey = await surveyRepo.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { versionNumber: 'desc' },
    });
  
    // Create profiles for dependents if no existing family ID
    if (!familyId) {
      for (const dep of dependents) {
        const res = await profileRepo.create({
          data: {
            ...noNextOfKinProfileData,
            firstName: dep.firstName,
            lastName: dep.lastName,
            dob: new Date(dep.dob),
            familyId: profile.familyId,
            participantType: dep.permanent
              ? ParticipantType.DEPENDENT_OTHER
              : ParticipantType.DEPENDENT_AGE,
          },
        });
        if (currentSurvey) {
          await spRepo.create({
            data: {
              profileId: res.id,
              versionId: currentSurvey.id,
              answers: createDefaultAnswers(currentSurvey.data),
            },
          });
        }
      }
    }
  
    // Assign survey to the main profile
    if (currentSurvey) {
      await spRepo.create({
        data: {
          profileId: profile.id,
          versionId: currentSurvey.id,
          answers: createDefaultAnswers(currentSurvey.data),
        },
      });
    }
  
    // Generate token
    const token = await generateToken({ userId: insertedUser.id, roles: [insertedUser.role] });
  
    const responseData = {
      message: `Created participant with user ID: ${insertedUser.id}`,
      token,
    };

    return responseData;
}

  