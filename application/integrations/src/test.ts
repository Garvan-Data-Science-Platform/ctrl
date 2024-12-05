

import { Integrations } from "./integrations"
const mapping = require('./mapping.json')
const exampleMultipleProfiles = require('./test_data/exampleMultipleProfiles.json')



const int = new Integrations(mapping)

int.mapCSVToParticipantRequests(exampleMultipleProfiles)


