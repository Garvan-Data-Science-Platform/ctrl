/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UsersController } from './controllers/UsersController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SurveysController } from './controllers/SurveysController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { StudiesController } from './controllers/StudiesController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SettingsController } from './controllers/SettingsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProfilesController } from './controllers/ProfilesController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ParticipantsController } from './controllers/ParticipantsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { InvitesController } from './controllers/ParticipantsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OrganisationsController } from './controllers/OrganisationsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MailerController } from './controllers/MailerController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './controllers/AuthController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { IntegrationsController } from './controllers/IntegrationsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthCheckController } from './controllers/HealthCheckController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FamiliesController } from './controllers/FamiliesController';
import { expressAuthentication } from './authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');


const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "InternalErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"enum","enums":["Internal Server Error"],"required":true},
            "details": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UnauthorizedErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "details": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidateErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"enum","enums":["Validation Failed"],"required":true},
            "details": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.Role": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OperatorAdmin"]},{"dataType":"enum","enums":["Participant"]},{"dataType":"enum","enums":["OrganisationAdmin"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultSelection_Prisma._36_UserPayload_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"deleted":{"dataType":"boolean","required":true},"updatedAt":{"dataType":"datetime","required":true},"createdAt":{"dataType":"datetime","required":true},"role":{"ref":"_36_Enums.Role","required":true},"password":{"dataType":"string","required":true},"email":{"dataType":"string","required":true},"lastName":{"dataType":"string","required":true},"middleName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"firstName":{"dataType":"string","required":true},"id":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "User": {
        "dataType": "refAlias",
        "type": {"ref":"DefaultSelection_Prisma._36_UserPayload_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetAllUsersResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"User"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserByIdResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"User","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotFoundErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "message": {"dataType":"string","required":true},
            "details": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Role": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.Role","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "lastName": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "email": {"dataType":"string","required":true,"validators":{"pattern":{"errorMsg":"please provide valid email","value":"^(.+)@(.+)$"}}},
            "password": {"dataType":"string","required":true,"validators":{"minLength":{"value":8}}},
            "role": {"ref":"Role","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","validators":{"minLength":{"value":1}}},
            "lastName": {"dataType":"string","validators":{"minLength":{"value":1}}},
            "email": {"dataType":"string","validators":{"pattern":{"errorMsg":"please provide valid email","value":"^(.+)@(.+)$"}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserRoleRequest": {
        "dataType": "refObject",
        "properties": {
            "newRole": {"ref":"Role","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeneratePasswordResetLinkRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true,"validators":{"pattern":{"errorMsg":"please provide valid email","value":"^(.+)@(.+)$"}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResetPasswordRequest": {
        "dataType": "refObject",
        "properties": {
            "newPassword": {"dataType":"string","required":true,"validators":{"minLength":{"errorMsg":"Password must be at least 8 characters","value":8}}},
            "token": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyVersionStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["PUBLISHED"]},{"dataType":"enum","enums":["DRAFT"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyVersionBasic": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double"},
            "versionNumber": {"dataType":"double","required":true},
            "published_date": {"dataType":"string"},
            "status": {"ref":"SurveyVersionStatus","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetSurveyVersionsResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"SurveyVersionBasic"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DuoCode": {
        "dataType": "refObject",
        "properties": {
            "code": {"dataType":"string","required":true},
            "relatedAnswer": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"boolean"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyQuestionChoices": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"string","required":true},
            "tooltip": {"dataType":"string"},
            "required": {"dataType":"boolean","required":true},
            "choices": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "duoCodes": {"dataType":"array","array":{"dataType":"refObject","ref":"DuoCode"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyQuestionCheckbox": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"string","required":true},
            "tooltip": {"dataType":"string"},
            "required": {"dataType":"boolean","required":true},
            "duoCodes": {"dataType":"array","array":{"dataType":"refObject","ref":"DuoCode"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyVideo": {
        "dataType": "refObject",
        "properties": {
            "link": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveySubHeading": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyElementType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["question-choices"]},{"dataType":"enum","enums":["question-checkbox"]},{"dataType":"enum","enums":["subheading"]},{"dataType":"enum","enums":["video"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyElement": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"SurveyQuestionChoices","required":true},"type":{"dataType":"enum","enums":["question-choices"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"SurveyQuestionCheckbox","required":true},"type":{"dataType":"enum","enums":["question-checkbox"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"SurveyVideo","required":true},"type":{"dataType":"enum","enums":["video"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"ref":"SurveySubHeading","required":true},"type":{"dataType":"enum","enums":["subheading"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"any","required":true},"type":{"ref":"SurveyElementType","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyStep": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "text": {"dataType":"string","required":true},
            "last_updated": {"dataType":"string"},
            "elements": {"dataType":"array","array":{"dataType":"refAlias","ref":"SurveyElement"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyVersion": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double"},
            "version_number": {"dataType":"double"},
            "published_date": {"dataType":"string"},
            "status": {"ref":"SurveyVersionStatus","required":true},
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"SurveyStep"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetSurveyVersionByVersionNumberResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"SurveyVersion","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyStepStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["completed"]},{"dataType":"enum","enums":["review_required"]},{"dataType":"enum","enums":["viewed"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserSurveyStepsResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"last_updated":{"dataType":"string"},"status":{"ref":"SurveyStepStatus","required":true},"tooltip":{"dataType":"string","required":true},"title":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserStepContext": {
        "dataType": "refObject",
        "properties": {
            "current_step": {"dataType":"double","required":true},
            "total_steps": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserSurveyStepResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"intersection","subSchemas":[{"ref":"SurveyStep"},{"ref":"UserStepContext"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetResponsesByIdResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"derived_from":{"dataType":"string"},"steps":{"dataType":"array","array":{"dataType":"refObject","ref":"SurveyStep"},"required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SurveyStepAnswerArray": {
        "dataType": "refAlias",
        "type": {"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"boolean"},{"dataType":"enum","enums":[null]}]},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserSurveyStepState": {
        "dataType": "refObject",
        "properties": {
            "status": {"ref":"SurveyStepStatus","required":true},
            "answers": {"ref":"SurveyStepAnswerArray","required":true},
            "last_updated": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantData": {
        "dataType": "refObject",
        "properties": {
            "profile": {"dataType":"nestedObjectLiteral","nestedProperties":{"familyId":{"dataType":"double","required":true},"dob":{"dataType":"datetime","required":true},"lastName":{"dataType":"string","required":true},"firstName":{"dataType":"string","required":true}},"required":true},
            "answers": {"dataType":"array","array":{"dataType":"refObject","ref":"UserSurveyStepState"},"required":true},
            "versionId": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetAllResponsesResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"participants":{"dataType":"array","array":{"dataType":"refObject","ref":"ParticipantData"},"required":true},"surveyData":{"dataType":"array","array":{"dataType":"refObject","ref":"SurveyStep"},"required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSurveyAnswersRequest": {
        "dataType": "refObject",
        "properties": {
            "step": {"dataType":"double","required":true},
            "data": {"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"boolean"}]},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSurveyRequest": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"SurveyStep"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultSelection_Prisma._36_StudyPayload_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"inviteEmailText":{"dataType":"string","required":true},"inviteEmailSubject":{"dataType":"string","required":true},"deleted":{"dataType":"boolean","required":true},"id":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Study": {
        "dataType": "refAlias",
        "type": {"ref":"DefaultSelection_Prisma._36_StudyPayload_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetAllStudiesResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"Study"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetStudyByIdResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"Study","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateStudyResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateStudyRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateStudyRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetSettingsResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"redcapURL":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"redcapToken":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"secondaryColour":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"primaryColour":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"mailerPassword":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"mailerUser":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"mailerPort":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"mailerHost":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_GetSettingsResponse-at-data_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"mailerHost":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"mailerPort":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"mailerUser":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"mailerPassword":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"primaryColour":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"secondaryColour":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"redcapToken":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]},"redcapURL":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSettingsRequest": {
        "dataType": "refAlias",
        "type": {"ref":"Partial_GetSettingsResponse-at-data_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetThemeResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"secondaryColour":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"primaryColour":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StateTerritory": {
        "dataType": "refEnum",
        "enums": ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContactMethod": {
        "dataType": "refEnum",
        "enums": ["EMAIL","MOBILE","MAIL"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantType": {
        "dataType": "refEnum",
        "enums": ["STANDARD","GUARDIAN","DEPENDENT_AGE","DEPENDENT_OTHER"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AlternativeContact": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","required":true},
            "middleName": {"dataType":"string"},
            "lastName": {"dataType":"string","required":true},
            "mobile": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "email": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FamilyMember": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","required":true},
            "middleName": {"dataType":"string"},
            "lastName": {"dataType":"string","required":true},
            "dob": {"dataType":"string","required":true},
            "id": {"dataType":"double","required":true},
            "participantType": {"ref":"ParticipantType","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetParticipantProfileResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"familyId":{"dataType":"double","required":true},"familyMembers":{"dataType":"array","array":{"dataType":"refObject","ref":"FamilyMember"},"required":true},"nextOfKin":{"ref":"AlternativeContact"},"participantType":{"ref":"ParticipantType","required":true},"preferredContact":{"ref":"ContactMethod","required":true},"postcode":{"dataType":"string"},"state":{"ref":"StateTerritory"},"suburb":{"dataType":"string"},"addressLine":{"dataType":"string"},"mobile":{"dataType":"string","required":true},"email":{"dataType":"string"},"dob":{"dataType":"string","required":true},"lastName":{"dataType":"string","required":true},"middleName":{"dataType":"string"},"firstName":{"dataType":"string","required":true},"id":{"dataType":"double","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OnBehalf": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "dob": {"dataType":"string","required":true},
            "permanent": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RegisterParticipantRequest_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"firstName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"minLength":{"value":1}}},"middleName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"minLength":{"value":1}}},"lastName":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"minLength":{"value":1}}},"email":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"pattern":{"errorMsg":"please provide valid email","value":"^(.+)@(.+)$"}}},"mobile":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"pattern":{"errorMsg":"please provide valid phone number","value":"^(\\+\\d{1,2}\\s?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$"}}},"preferredContact":{"dataType":"union","subSchemas":[{"ref":"ContactMethod"},{"dataType":"undefined"}]},"addressLine":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"minLength":{"value":1}}},"suburb":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"minLength":{"value":1}}},"postcode":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"minLength":{"value":1}}},"state":{"dataType":"union","subSchemas":[{"ref":"StateTerritory"},{"dataType":"undefined"}]},"password":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"minLength":{"errorMsg":"Password must be at least 8 characters","value":8}}},"dob":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}],"validators":{"isDate":{"errorMsg":"Date of birth must be of date format"}}},"participantType":{"dataType":"union","subSchemas":[{"ref":"ParticipantType"},{"dataType":"undefined"}]},"nextOfKin":{"dataType":"union","subSchemas":[{"ref":"AlternativeContact"},{"dataType":"undefined"}]},"dependents":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"OnBehalf"}},{"dataType":"undefined"}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateProfileRequest": {
        "dataType": "refAlias",
        "type": {"ref":"Partial_RegisterParticipantRequest_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantAnswerStatus": {
        "dataType": "refObject",
        "properties": {
            "surveyVersionNumber": {"dataType":"double","required":true},
            "participantId": {"dataType":"double","required":true},
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["complete"]},{"dataType":"enum","enums":["partially_complete"]},{"dataType":"enum","enums":["incomplete"]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Participant": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "email": {"dataType":"string"},
            "firstName": {"dataType":"string","required":true},
            "lastName": {"dataType":"string","required":true},
            "familyId": {"dataType":"double","required":true},
            "answers": {"dataType":"array","array":{"dataType":"refObject","ref":"ParticipantAnswerStatus"},"required":true},
            "lastUpdated": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetParticipantsResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"Participant"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ParticipantWithProfile": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Participant"},{"dataType":"nestedObjectLiteral","nestedProperties":{"profile":{"dataType":"nestedObjectLiteral","nestedProperties":{"familyId":{"dataType":"double","required":true},"familyMembers":{"dataType":"array","array":{"dataType":"refObject","ref":"FamilyMember"},"required":true},"nextOfKin":{"ref":"AlternativeContact"},"participantType":{"ref":"ParticipantType","required":true},"preferredContact":{"ref":"ContactMethod","required":true},"postcode":{"dataType":"string"},"state":{"ref":"StateTerritory"},"suburb":{"dataType":"string"},"addressLine":{"dataType":"string"},"mobile":{"dataType":"string","required":true},"email":{"dataType":"string"},"dob":{"dataType":"string","required":true},"lastName":{"dataType":"string","required":true},"middleName":{"dataType":"string"},"firstName":{"dataType":"string","required":true},"id":{"dataType":"double","required":true}},"required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetParticipantResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ParticipantWithProfile","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetUserInvitesResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"invites":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"studyName":{"dataType":"string","required":true},"sentAt":{"dataType":"string"},"expiresAt":{"dataType":"string","required":true},"createdAt":{"dataType":"string","required":true},"studyId":{"dataType":"double","required":true},"email":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InviteStatus": {
        "dataType": "refEnum",
        "enums": ["PENDING","ACCEPTED","EXPIRED","REVOKED","FAILED_TO_SEND"],
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetInvitesResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"inviteStatus":{"ref":"InviteStatus","required":true},"sentAt":{"dataType":"string"},"expiresAt":{"dataType":"string","required":true},"createdAt":{"dataType":"string","required":true},"studyId":{"dataType":"double","required":true},"email":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InviteParticipantsResponse": {
        "dataType": "refObject",
        "properties": {
            "resendEmailRequestCount": {"dataType":"double","required":true},
            "newInvitesCount": {"dataType":"double","required":true},
            "emailsResentCount": {"dataType":"double","required":true},
            "failedEmails": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "failedEmailsCount": {"dataType":"double","required":true},
            "alreadyAcceptedCount": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Email": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{"pattern":{"errorMsg":"Please provide valid email","value":"^(.+)@(.+)$"}}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InviteParticipantsRequest": {
        "dataType": "refObject",
        "properties": {
            "emails": {"dataType":"array","array":{"dataType":"refAlias","ref":"Email"},"required":true},
            "subjectText": {"dataType":"string","required":true},
            "explanatoryText": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetInviteTextResponse": {
        "dataType": "refObject",
        "properties": {
            "inviteEmailSubject": {"dataType":"string","required":true},
            "inviteEmailText": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultSelection_Prisma._36_OrganisationPayload_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"logo":{"dataType":"union","subSchemas":[{"dataType":"buffer"},{"dataType":"enum","enums":[null]}],"required":true},"redcapURL":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"redcapToken":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"secondaryColour":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"primaryColour":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"mailerPassword":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"mailerUser":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"mailerPort":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"mailerHost":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"updatedAt":{"dataType":"datetime","required":true},"createdAt":{"dataType":"datetime","required":true},"id":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Organisation": {
        "dataType": "refAlias",
        "type": {"ref":"DefaultSelection_Prisma._36_OrganisationPayload_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetAllOrganisationsResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"Organisation"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetOrganisationByIdResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"Organisation","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOrganisationResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOrganisationRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateOrganisationRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetOrganisationUsersResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"User"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContactUsRequest": {
        "dataType": "refObject",
        "properties": {
            "subject": {"dataType":"string","required":true},
            "content": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegisterResponse": {
        "dataType": "refObject",
        "properties": {
            "token": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegisterRequest": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "middleName": {"dataType":"string","validators":{"minLength":{"value":1}}},
            "lastName": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "email": {"dataType":"string","required":true,"validators":{"pattern":{"errorMsg":"Please provide valid email","value":"^(.+)@(.+)$"}}},
            "password": {"dataType":"string","required":true,"validators":{"minLength":{"errorMsg":"Password must be at least 8 characters","value":8}}},
            "role": {"ref":"Role","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetupResponse": {
        "dataType": "refObject",
        "properties": {
            "isSetup": {"dataType":"boolean","required":true},
            "oidc": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"icon":{"dataType":"string","required":true},"clientId":{"dataType":"string","required":true},"host":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegisterSetupRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true,"validators":{"pattern":{"errorMsg":"Please provide valid email","value":"^(.+)@(.+)$"}}},
            "password": {"dataType":"string","required":true,"validators":{"minLength":{"errorMsg":"Password must be at least 8 characters","value":8}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegisterParticipantResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "token": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RegisterParticipantRequest": {
        "dataType": "refObject",
        "properties": {
            "firstName": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "middleName": {"dataType":"string","validators":{"minLength":{"value":1}}},
            "lastName": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "email": {"dataType":"string","required":true,"validators":{"pattern":{"errorMsg":"please provide valid email","value":"^(.+)@(.+)$"}}},
            "mobile": {"dataType":"string","required":true,"validators":{"pattern":{"errorMsg":"please provide valid phone number","value":"^(\\+\\d{1,2}\\s?)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$"}}},
            "preferredContact": {"ref":"ContactMethod","required":true},
            "addressLine": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "suburb": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "postcode": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
            "state": {"ref":"StateTerritory","required":true},
            "password": {"dataType":"string","required":true,"validators":{"minLength":{"errorMsg":"Password must be at least 8 characters","value":8}}},
            "dob": {"dataType":"string","required":true,"validators":{"isDate":{"errorMsg":"Date of birth must be of date format"}}},
            "participantType": {"ref":"ParticipantType","required":true},
            "nextOfKin": {"ref":"AlternativeContact","required":true},
            "dependents": {"dataType":"array","array":{"dataType":"refObject","ref":"OnBehalf"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginResponse": {
        "dataType": "refObject",
        "properties": {
            "token": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OIDCLoginRequest": {
        "dataType": "refObject",
        "properties": {
            "code": {"dataType":"string","required":true},
            "provider": {"dataType":"string","required":true},
            "redirect_uri": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true,"validators":{"pattern":{"errorMsg":"Please provide valid email","value":"^(.+)@(.+)$"}}},
            "password": {"dataType":"string","required":true,"validators":{"minLength":{"errorMsg":"Password must be at least 8 characters","value":8}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadRedcapParticipantResponse": {
        "dataType": "refObject",
        "properties": {
            "profilesCreatedCount": {"dataType":"double","required":true},
            "profilesAlreadyExistedCount": {"dataType":"double","required":true},
            "ids": {"dataType":"array","array":{"dataType":"double"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadRedcapParticipantAPIRequest": {
        "dataType": "refObject",
        "properties": {
            "formName": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadRedcapInstrumentResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "versionNumber": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadRedcapInstrumentAPIRequest": {
        "dataType": "refObject",
        "properties": {
            "formName": {"dataType":"string","required":true,"validators":{"minLength":{"value":1}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GetFamilyResponse": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"FamilyMember"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddDependentRequest": {
        "dataType": "refAlias",
        "type": {"ref":"OnBehalf","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsUsersController_getAllUsers: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/users',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getAllUsers)),

            async function UsersController_getAllUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getAllUsers, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getAllUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_getAllAdminUsers: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/users/admin',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getAllAdminUsers)),

            async function UsersController_getAllAdminUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getAllAdminUsers, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getAllAdminUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_getUserById: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"double"},
        };
        app.get('/users/:userId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.getUserById)),

            async function UsersController_getUserById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_getUserById, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'getUserById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_createUser: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"CreateUserRequest"},
        };
        app.post('/users',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.createUser)),

            async function UsersController_createUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_createUser, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'createUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_updateUser: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UpdateUserRequest"},
        };
        app.patch('/users/:userId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.updateUser)),

            async function UsersController_updateUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_updateUser, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'updateUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_deleteUser: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"double"},
        };
        app.delete('/users/:userId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.deleteUser)),

            async function UsersController_deleteUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_deleteUser, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'deleteUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_updateUserRole: Record<string, TsoaRoute.ParameterSchema> = {
                userID: {"in":"path","name":"userID","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UpdateUserRoleRequest"},
        };
        app.patch('/users/:userID/role',
            authenticateMiddleware([{"jwt":["OperatorAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.updateUserRole)),

            async function UsersController_updateUserRole(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_updateUserRole, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'updateUserRole',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_generatePasswordResetLink: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"GeneratePasswordResetLinkRequest"},
        };
        app.post('/users/password/generate-reset-link',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.generatePasswordResetLink)),

            async function UsersController_generatePasswordResetLink(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_generatePasswordResetLink, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'generatePasswordResetLink',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUsersController_resetPassword: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"ResetPasswordRequest"},
        };
        app.post('/users/password/reset',
            ...(fetchMiddlewares<RequestHandler>(UsersController)),
            ...(fetchMiddlewares<RequestHandler>(UsersController.prototype.resetPassword)),

            async function UsersController_resetPassword(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUsersController_resetPassword, request, response });

                const controller = new UsersController();

              await templateService.apiHandler({
                methodName: 'resetPassword',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_getAllSurveys: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/surveys',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.getAllSurveys)),

            async function SurveysController_getAllSurveys(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_getAllSurveys, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'getAllSurveys',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_getSurveyVersionByVersionNumber: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                versionNumber: {"in":"path","name":"versionNumber","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/surveys/:versionNumber',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.getSurveyVersionByVersionNumber)),

            async function SurveysController_getSurveyVersionByVersionNumber(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_getSurveyVersionByVersionNumber, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'getSurveyVersionByVersionNumber',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_getUserSurveySteps: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/survey-steps',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.getUserSurveySteps)),

            async function SurveysController_getUserSurveySteps(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_getUserSurveySteps, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'getUserSurveySteps',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_getUserSurveyStep: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                stepId: {"in":"path","name":"stepId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/survey-steps/:stepId',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.getUserSurveyStep)),

            async function SurveysController_getUserSurveyStep(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_getUserSurveyStep, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'getUserSurveyStep',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_getUserResponses: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/survey-answers',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.getUserResponses)),

            async function SurveysController_getUserResponses(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_getUserResponses, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'getUserResponses',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_getAllResponses: Record<string, TsoaRoute.ParameterSchema> = {
                versionNumber: {"in":"path","name":"versionNumber","required":true,"dataType":"double"},
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/surveys/:versionNumber/participants/answers',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.getAllResponses)),

            async function SurveysController_getAllResponses(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_getAllResponses, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'getAllResponses',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_getResponsesById: Record<string, TsoaRoute.ParameterSchema> = {
                participantId: {"in":"path","name":"participantId","required":true,"dataType":"double"},
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/surveys/current/participants/:participantId/answers',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.getResponsesById)),

            async function SurveysController_getResponsesById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_getResponsesById, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'getResponsesById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_updateSurveyAnswers: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateSurveyAnswersRequest"},
        };
        app.post('/studies/:studyId/survey-answers',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.updateSurveyAnswers)),

            async function SurveysController_updateSurveyAnswers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_updateSurveyAnswers, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'updateSurveyAnswers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_updateSurvey: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                versionNumber: {"in":"path","name":"versionNumber","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UpdateSurveyRequest"},
        };
        app.patch('/studies/:studyId/surveys/:versionNumber',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.updateSurvey)),

            async function SurveysController_updateSurvey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_updateSurvey, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'updateSurvey',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSurveysController_publishSurvey: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                versionNumber: {"in":"path","name":"versionNumber","required":true,"dataType":"double"},
        };
        app.post('/studies/:studyId/surveys/:versionNumber/publish',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(SurveysController)),
            ...(fetchMiddlewares<RequestHandler>(SurveysController.prototype.publishSurvey)),

            async function SurveysController_publishSurvey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSurveysController_publishSurvey, request, response });

                const controller = new SurveysController();

              await templateService.apiHandler({
                methodName: 'publishSurvey',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudiesController_getAllStudies: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/studies',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(StudiesController)),
            ...(fetchMiddlewares<RequestHandler>(StudiesController.prototype.getAllStudies)),

            async function StudiesController_getAllStudies(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudiesController_getAllStudies, request, response });

                const controller = new StudiesController();

              await templateService.apiHandler({
                methodName: 'getAllStudies',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudiesController_listStudies: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/studies/list',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(StudiesController)),
            ...(fetchMiddlewares<RequestHandler>(StudiesController.prototype.listStudies)),

            async function StudiesController_listStudies(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudiesController_listStudies, request, response });

                const controller = new StudiesController();

              await templateService.apiHandler({
                methodName: 'listStudies',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudiesController_getStudyById: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(StudiesController)),
            ...(fetchMiddlewares<RequestHandler>(StudiesController.prototype.getStudyById)),

            async function StudiesController_getStudyById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudiesController_getStudyById, request, response });

                const controller = new StudiesController();

              await templateService.apiHandler({
                methodName: 'getStudyById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudiesController_createStudy: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"CreateStudyRequest"},
        };
        app.post('/studies',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(StudiesController)),
            ...(fetchMiddlewares<RequestHandler>(StudiesController.prototype.createStudy)),

            async function StudiesController_createStudy(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudiesController_createStudy, request, response });

                const controller = new StudiesController();

              await templateService.apiHandler({
                methodName: 'createStudy',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudiesController_updateStudy: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UpdateStudyRequest"},
        };
        app.patch('/studies/:studyId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(StudiesController)),
            ...(fetchMiddlewares<RequestHandler>(StudiesController.prototype.updateStudy)),

            async function StudiesController_updateStudy(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudiesController_updateStudy, request, response });

                const controller = new StudiesController();

              await templateService.apiHandler({
                methodName: 'updateStudy',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsStudiesController_deleteStudy: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.delete('/studies/:studyId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(StudiesController)),
            ...(fetchMiddlewares<RequestHandler>(StudiesController.prototype.deleteStudy)),

            async function StudiesController_deleteStudy(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStudiesController_deleteStudy, request, response });

                const controller = new StudiesController();

              await templateService.apiHandler({
                methodName: 'deleteStudy',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSettingsController_getSettings: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/settings',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(SettingsController)),
            ...(fetchMiddlewares<RequestHandler>(SettingsController.prototype.getSettings)),

            async function SettingsController_getSettings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSettingsController_getSettings, request, response });

                const controller = new SettingsController();

              await templateService.apiHandler({
                methodName: 'getSettings',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSettingsController_updateSettings: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UpdateSettingsRequest"},
        };
        app.patch('/settings',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(SettingsController)),
            ...(fetchMiddlewares<RequestHandler>(SettingsController.prototype.updateSettings)),

            async function SettingsController_updateSettings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSettingsController_updateSettings, request, response });

                const controller = new SettingsController();

              await templateService.apiHandler({
                methodName: 'updateSettings',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSettingsController_getTheme: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/settings/theme',
            ...(fetchMiddlewares<RequestHandler>(SettingsController)),
            ...(fetchMiddlewares<RequestHandler>(SettingsController.prototype.getTheme)),

            async function SettingsController_getTheme(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSettingsController_getTheme, request, response });

                const controller = new SettingsController();

              await templateService.apiHandler({
                methodName: 'getTheme',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSettingsController_uploadLogo: Record<string, TsoaRoute.ParameterSchema> = {
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
        };
        app.post('/settings/logo',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(SettingsController)),
            ...(fetchMiddlewares<RequestHandler>(SettingsController.prototype.uploadLogo)),

            async function SettingsController_uploadLogo(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSettingsController_uploadLogo, request, response });

                const controller = new SettingsController();

              await templateService.apiHandler({
                methodName: 'uploadLogo',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSettingsController_getLogo: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/settings/logo',
            ...(fetchMiddlewares<RequestHandler>(SettingsController)),
            ...(fetchMiddlewares<RequestHandler>(SettingsController.prototype.getLogo)),

            async function SettingsController_getLogo(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSettingsController_getLogo, request, response });

                const controller = new SettingsController();

              await templateService.apiHandler({
                methodName: 'getLogo',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProfilesController_getCurrentParticipantProfile: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/profiles/current',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController)),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController.prototype.getCurrentParticipantProfile)),

            async function ProfilesController_getCurrentParticipantProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProfilesController_getCurrentParticipantProfile, request, response });

                const controller = new ProfilesController();

              await templateService.apiHandler({
                methodName: 'getCurrentParticipantProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProfilesController_getParticipantProfileByUserID: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"double"},
        };
        app.get('/profiles/user/:userId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController)),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController.prototype.getParticipantProfileByUserID)),

            async function ProfilesController_getParticipantProfileByUserID(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProfilesController_getParticipantProfileByUserID, request, response });

                const controller = new ProfilesController();

              await templateService.apiHandler({
                methodName: 'getParticipantProfileByUserID',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProfilesController_getParticipantProfileByID: Record<string, TsoaRoute.ParameterSchema> = {
                profileId: {"in":"path","name":"profileId","required":true,"dataType":"double"},
        };
        app.get('/profiles/:profileId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController)),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController.prototype.getParticipantProfileByID)),

            async function ProfilesController_getParticipantProfileByID(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProfilesController_getParticipantProfileByID, request, response });

                const controller = new ProfilesController();

              await templateService.apiHandler({
                methodName: 'getParticipantProfileByID',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProfilesController_updateCurrentProfile: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UpdateProfileRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/profiles/current',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController)),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController.prototype.updateCurrentProfile)),

            async function ProfilesController_updateCurrentProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProfilesController_updateCurrentProfile, request, response });

                const controller = new ProfilesController();

              await templateService.apiHandler({
                methodName: 'updateCurrentProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProfilesController_updateProfileById: Record<string, TsoaRoute.ParameterSchema> = {
                profileId: {"in":"path","name":"profileId","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UpdateProfileRequest"},
        };
        app.patch('/profiles/:profileId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController)),
            ...(fetchMiddlewares<RequestHandler>(ProfilesController.prototype.updateProfileById)),

            async function ProfilesController_updateProfileById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProfilesController_updateProfileById, request, response });

                const controller = new ProfilesController();

              await templateService.apiHandler({
                methodName: 'updateProfileById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsParticipantsController_getParticipants: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/participants',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ParticipantsController)),
            ...(fetchMiddlewares<RequestHandler>(ParticipantsController.prototype.getParticipants)),

            async function ParticipantsController_getParticipants(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsParticipantsController_getParticipants, request, response });

                const controller = new ParticipantsController();

              await templateService.apiHandler({
                methodName: 'getParticipants',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsParticipantsController_getParticipantById: Record<string, TsoaRoute.ParameterSchema> = {
                profileId: {"in":"path","name":"profileId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/participants/:profileId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(ParticipantsController)),
            ...(fetchMiddlewares<RequestHandler>(ParticipantsController.prototype.getParticipantById)),

            async function ParticipantsController_getParticipantById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsParticipantsController_getParticipantById, request, response });

                const controller = new ParticipantsController();

              await templateService.apiHandler({
                methodName: 'getParticipantById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsInvitesController_getUserInvites: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/invites/pending',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(InvitesController)),
            ...(fetchMiddlewares<RequestHandler>(InvitesController.prototype.getUserInvites)),

            async function InvitesController_getUserInvites(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsInvitesController_getUserInvites, request, response });

                const controller = new InvitesController();

              await templateService.apiHandler({
                methodName: 'getUserInvites',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsInvitesController_acceptInvite: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                inviteId: {"in":"path","name":"inviteId","required":true,"dataType":"string"},
        };
        app.post('/invites/:inviteId/accept',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(InvitesController)),
            ...(fetchMiddlewares<RequestHandler>(InvitesController.prototype.acceptInvite)),

            async function InvitesController_acceptInvite(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsInvitesController_acceptInvite, request, response });

                const controller = new InvitesController();

              await templateService.apiHandler({
                methodName: 'acceptInvite',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsInvitesController_getInvites: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/invites',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(InvitesController)),
            ...(fetchMiddlewares<RequestHandler>(InvitesController.prototype.getInvites)),

            async function InvitesController_getInvites(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsInvitesController_getInvites, request, response });

                const controller = new InvitesController();

              await templateService.apiHandler({
                methodName: 'getInvites',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsInvitesController_createInvites: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"InviteParticipantsRequest"},
        };
        app.post('/studies/:studyId/invites',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(InvitesController)),
            ...(fetchMiddlewares<RequestHandler>(InvitesController.prototype.createInvites)),

            async function InvitesController_createInvites(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsInvitesController_createInvites, request, response });

                const controller = new InvitesController();

              await templateService.apiHandler({
                methodName: 'createInvites',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsInvitesController_resendInviteById: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                inviteId: {"in":"path","name":"inviteId","required":true,"dataType":"string"},
        };
        app.post('/studies/:studyId/invites/:inviteId/resend',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(InvitesController)),
            ...(fetchMiddlewares<RequestHandler>(InvitesController.prototype.resendInviteById)),

            async function InvitesController_resendInviteById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsInvitesController_resendInviteById, request, response });

                const controller = new InvitesController();

              await templateService.apiHandler({
                methodName: 'resendInviteById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsInvitesController_resendPendingInvites: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.post('/studies/:studyId/invites/resend',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(InvitesController)),
            ...(fetchMiddlewares<RequestHandler>(InvitesController.prototype.resendPendingInvites)),

            async function InvitesController_resendPendingInvites(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsInvitesController_resendPendingInvites, request, response });

                const controller = new InvitesController();

              await templateService.apiHandler({
                methodName: 'resendPendingInvites',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsInvitesController_revokeInvite: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                inviteId: {"in":"path","name":"inviteId","required":true,"dataType":"string"},
        };
        app.post('/studies/:studyId/invites/:inviteId/revoke',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(InvitesController)),
            ...(fetchMiddlewares<RequestHandler>(InvitesController.prototype.revokeInvite)),

            async function InvitesController_revokeInvite(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsInvitesController_revokeInvite, request, response });

                const controller = new InvitesController();

              await templateService.apiHandler({
                methodName: 'revokeInvite',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsInvitesController_getInviteText: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/invites/text',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(InvitesController)),
            ...(fetchMiddlewares<RequestHandler>(InvitesController.prototype.getInviteText)),

            async function InvitesController_getInviteText(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsInvitesController_getInviteText, request, response });

                const controller = new InvitesController();

              await templateService.apiHandler({
                methodName: 'getInviteText',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrganisationsController_getAllOrganisations: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/organisations',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController)),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController.prototype.getAllOrganisations)),

            async function OrganisationsController_getAllOrganisations(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrganisationsController_getAllOrganisations, request, response });

                const controller = new OrganisationsController();

              await templateService.apiHandler({
                methodName: 'getAllOrganisations',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrganisationsController_getOrganisationById: Record<string, TsoaRoute.ParameterSchema> = {
                orgID: {"in":"path","name":"orgID","required":true,"dataType":"double"},
        };
        app.get('/organisations/:orgID',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController)),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController.prototype.getOrganisationById)),

            async function OrganisationsController_getOrganisationById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrganisationsController_getOrganisationById, request, response });

                const controller = new OrganisationsController();

              await templateService.apiHandler({
                methodName: 'getOrganisationById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrganisationsController_createOrganisation: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"CreateOrganisationRequest"},
        };
        app.post('/organisations',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController)),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController.prototype.createOrganisation)),

            async function OrganisationsController_createOrganisation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrganisationsController_createOrganisation, request, response });

                const controller = new OrganisationsController();

              await templateService.apiHandler({
                methodName: 'createOrganisation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrganisationsController_updateOrganisation: Record<string, TsoaRoute.ParameterSchema> = {
                orgID: {"in":"path","name":"orgID","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UpdateOrganisationRequest"},
        };
        app.patch('/organisations/:orgID',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController)),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController.prototype.updateOrganisation)),

            async function OrganisationsController_updateOrganisation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrganisationsController_updateOrganisation, request, response });

                const controller = new OrganisationsController();

              await templateService.apiHandler({
                methodName: 'updateOrganisation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrganisationsController_deleteOrganisation: Record<string, TsoaRoute.ParameterSchema> = {
                orgID: {"in":"path","name":"orgID","required":true,"dataType":"double"},
        };
        app.delete('/organisations/:orgID',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController)),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController.prototype.deleteOrganisation)),

            async function OrganisationsController_deleteOrganisation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrganisationsController_deleteOrganisation, request, response });

                const controller = new OrganisationsController();

              await templateService.apiHandler({
                methodName: 'deleteOrganisation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrganisationsController_getOrganisationUsers: Record<string, TsoaRoute.ParameterSchema> = {
                orgID: {"in":"path","name":"orgID","required":true,"dataType":"double"},
        };
        app.get('/organisations/:orgID/users',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController)),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController.prototype.getOrganisationUsers)),

            async function OrganisationsController_getOrganisationUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrganisationsController_getOrganisationUsers, request, response });

                const controller = new OrganisationsController();

              await templateService.apiHandler({
                methodName: 'getOrganisationUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrganisationsController_addUserToOrganisation: Record<string, TsoaRoute.ParameterSchema> = {
                orgID: {"in":"path","name":"orgID","required":true,"dataType":"double"},
                userId: {"in":"path","name":"userId","required":true,"dataType":"double"},
        };
        app.post('/organisations/:orgID/users/:userId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController)),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController.prototype.addUserToOrganisation)),

            async function OrganisationsController_addUserToOrganisation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrganisationsController_addUserToOrganisation, request, response });

                const controller = new OrganisationsController();

              await templateService.apiHandler({
                methodName: 'addUserToOrganisation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOrganisationsController_removeUserFromOrganisation: Record<string, TsoaRoute.ParameterSchema> = {
                orgID: {"in":"path","name":"orgID","required":true,"dataType":"double"},
                userId: {"in":"path","name":"userId","required":true,"dataType":"double"},
        };
        app.delete('/organisations/:orgID/users/:userId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController)),
            ...(fetchMiddlewares<RequestHandler>(OrganisationsController.prototype.removeUserFromOrganisation)),

            async function OrganisationsController_removeUserFromOrganisation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOrganisationsController_removeUserFromOrganisation, request, response });

                const controller = new OrganisationsController();

              await templateService.apiHandler({
                methodName: 'removeUserFromOrganisation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMailerController_contactUs: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"ContactUsRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/mailer/contact-us',
            authenticateMiddleware([{"jwt":["Participant"]}]),
            ...(fetchMiddlewares<RequestHandler>(MailerController)),
            ...(fetchMiddlewares<RequestHandler>(MailerController.prototype.contactUs)),

            async function MailerController_contactUs(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMailerController_contactUs, request, response });

                const controller = new MailerController();

              await templateService.apiHandler({
                methodName: 'contactUs',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_registerUser: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"RegisterRequest"},
        };
        app.post('/auth/register',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.registerUser)),

            async function AuthController_registerUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_registerUser, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'registerUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_checkSetup: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/auth/setup',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.checkSetup)),

            async function AuthController_checkSetup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_checkSetup, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'checkSetup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_registerInitialUser: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"RegisterSetupRequest"},
        };
        app.post('/auth/register/setup',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.registerInitialUser)),

            async function AuthController_registerInitialUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_registerInitialUser, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'registerInitialUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_registerParticipant: Record<string, TsoaRoute.ParameterSchema> = {
                inviteId: {"in":"path","name":"inviteId","required":true,"dataType":"string"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"RegisterParticipantRequest"},
        };
        app.post('/auth/register/participants/:inviteId',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.registerParticipant)),

            async function AuthController_registerParticipant(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_registerParticipant, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'registerParticipant',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_loginOIDC: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"OIDCLoginRequest"},
                clientType: {"in":"header","name":"x-client-type","dataType":"string"},
        };
        app.post('/auth/login/oidc',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.loginOIDC)),

            async function AuthController_loginOIDC(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_loginOIDC, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'loginOIDC',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"LoginRequest"},
                clientType: {"in":"header","name":"x-client-type","dataType":"string"},
        };
        app.post('/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.login)),

            async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIntegrationsController_uploadRedcapParticipantCSV: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
        };
        app.post('/studies/:studyId/integrations/redcap/participant/upload/csv',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationsController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationsController.prototype.uploadRedcapParticipantCSV)),

            async function IntegrationsController_uploadRedcapParticipantCSV(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationsController_uploadRedcapParticipantCSV, request, response });

                const controller = new IntegrationsController();

              await templateService.apiHandler({
                methodName: 'uploadRedcapParticipantCSV',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIntegrationsController_uploadRedcapParticipantAPI: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UploadRedcapParticipantAPIRequest"},
        };
        app.post('/studies/:studyId/integrations/redcap/participant/upload/api',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationsController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationsController.prototype.uploadRedcapParticipantAPI)),

            async function IntegrationsController_uploadRedcapParticipantAPI(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationsController_uploadRedcapParticipantAPI, request, response });

                const controller = new IntegrationsController();

              await templateService.apiHandler({
                methodName: 'uploadRedcapParticipantAPI',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIntegrationsController_uploadRedcapInstrumentCSV: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
        };
        app.post('/studies/:studyId/integrations/redcap/instrument/upload/csv',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationsController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationsController.prototype.uploadRedcapInstrumentCSV)),

            async function IntegrationsController_uploadRedcapInstrumentCSV(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationsController_uploadRedcapInstrumentCSV, request, response });

                const controller = new IntegrationsController();

              await templateService.apiHandler({
                methodName: 'uploadRedcapInstrumentCSV',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIntegrationsController_uploadRedcapInstrumentAPI: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"UploadRedcapInstrumentAPIRequest"},
        };
        app.post('/studies/:studyId/integrations/redcap/instrument/upload/api',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationsController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationsController.prototype.uploadRedcapInstrumentAPI)),

            async function IntegrationsController_uploadRedcapInstrumentAPI(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationsController_uploadRedcapInstrumentAPI, request, response });

                const controller = new IntegrationsController();

              await templateService.apiHandler({
                methodName: 'uploadRedcapInstrumentAPI',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthCheckController_HealthCheck: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/',
            ...(fetchMiddlewares<RequestHandler>(HealthCheckController)),
            ...(fetchMiddlewares<RequestHandler>(HealthCheckController.prototype.HealthCheck)),

            async function HealthCheckController_HealthCheck(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthCheckController_HealthCheck, request, response });

                const controller = new HealthCheckController();

              await templateService.apiHandler({
                methodName: 'HealthCheck',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFamiliesController_getFamilyById: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                familyId: {"in":"path","name":"familyId","required":true,"dataType":"double"},
        };
        app.get('/studies/:studyId/families/:familyId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(FamiliesController)),
            ...(fetchMiddlewares<RequestHandler>(FamiliesController.prototype.getFamilyById)),

            async function FamiliesController_getFamilyById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFamiliesController_getFamilyById, request, response });

                const controller = new FamiliesController();

              await templateService.apiHandler({
                methodName: 'getFamilyById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFamiliesController_removeMember: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                profileId: {"in":"path","name":"profileId","required":true,"dataType":"double"},
        };
        app.post('/studies/:studyId/families/remove/:profileId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(FamiliesController)),
            ...(fetchMiddlewares<RequestHandler>(FamiliesController.prototype.removeMember)),

            async function FamiliesController_removeMember(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFamiliesController_removeMember, request, response });

                const controller = new FamiliesController();

              await templateService.apiHandler({
                methodName: 'removeMember',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFamiliesController_addExistingMember: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                familyId: {"in":"path","name":"familyId","required":true,"dataType":"double"},
                profileId: {"in":"path","name":"profileId","required":true,"dataType":"double"},
        };
        app.post('/studies/:studyId/families/:familyId/add/:profileId',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(FamiliesController)),
            ...(fetchMiddlewares<RequestHandler>(FamiliesController.prototype.addExistingMember)),

            async function FamiliesController_addExistingMember(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFamiliesController_addExistingMember, request, response });

                const controller = new FamiliesController();

              await templateService.apiHandler({
                methodName: 'addExistingMember',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsFamiliesController_addNewDependent: Record<string, TsoaRoute.ParameterSchema> = {
                studyId: {"in":"path","name":"studyId","required":true,"dataType":"double"},
                familyId: {"in":"path","name":"familyId","required":true,"dataType":"double"},
                bodyRequest: {"in":"body","name":"bodyRequest","required":true,"ref":"AddDependentRequest"},
        };
        app.post('/studies/:studyId/families/:familyId/add-dependent',
            authenticateMiddleware([{"jwt":["OrganisationAdmin"]}]),
            ...(fetchMiddlewares<RequestHandler>(FamiliesController)),
            ...(fetchMiddlewares<RequestHandler>(FamiliesController.prototype.addNewDependent)),

            async function FamiliesController_addNewDependent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFamiliesController_addNewDependent, request, response });

                const controller = new FamiliesController();

              await templateService.apiHandler({
                methodName: 'addNewDependent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
