"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantType = exports.StateTerritory = exports.ContactMethod = void 0;
var ContactMethod;
(function (ContactMethod) {
    ContactMethod["MOBILE"] = "MOBILE";
    ContactMethod["EMAIL"] = "EMAIL";
    ContactMethod["MAIL"] = "MAIL";
})(ContactMethod || (exports.ContactMethod = ContactMethod = {}));
var StateTerritory;
(function (StateTerritory) {
    StateTerritory["ACT"] = "ACT";
    StateTerritory["NSW"] = "NSW";
    StateTerritory["NT"] = "NT";
    StateTerritory["QLD"] = "QLD";
    StateTerritory["SA"] = "SA";
    StateTerritory["TAS"] = "TAS";
    StateTerritory["VIC"] = "VIC";
    StateTerritory["WA"] = "WA";
})(StateTerritory || (exports.StateTerritory = StateTerritory = {}));
var ParticipantType;
(function (ParticipantType) {
    ParticipantType["STANDARD"] = "STANDARD";
    ParticipantType["GUARDIAN"] = "GUARDIAN";
    ParticipantType["DEPENDENT_AGE"] = "DEPENDENT_AGE";
    ParticipantType["DEPENDENT_OTHER"] = "DEPENDENT_OTHER";
})(ParticipantType || (exports.ParticipantType = ParticipantType = {}));
