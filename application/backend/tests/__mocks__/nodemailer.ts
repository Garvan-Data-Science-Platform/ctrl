// load the real nodemailer
import nodemailer from 'nodemailer'
// pass it in when creating the mock using getMockFor()
import { getMockFor } from 'nodemailer-mock'
const nodemailermock = getMockFor(nodemailer)
// export the mocked module
module.exports = nodemailermock
