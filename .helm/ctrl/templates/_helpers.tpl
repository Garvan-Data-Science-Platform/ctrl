{{/*
Expand the name of the chart.
*/}}
{{- define "ctrl.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ctrl.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "ctrl.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "ctrl.labels" -}}
helm.sh/chart: {{ include "ctrl.chart" . }}
{{ include "ctrl.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "ctrl.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ctrl.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "ctrl.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "ctrl.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create or generate jwt secret
*/}}
{{- define "secret.jwt" -}}
{{- $secret := lookup "v1" "Secret" .Release.Namespace "jwt" -}}
{{- if $secret.data -}}
jwt: {{ $secret.data.jwt }}
{{- else -}}
jwt: {{ randAlphaNum 10 | b64enc }}
{{- end -}}
{{- end -}}

{{/*
Create or generate 256bit encryption key
*/}}
{{- define "secret.aeskey" -}}
{{- $secret := lookup "v1" "Secret" .Release.Namespace "aeskey" -}}
{{- if $secret.data.aeskey -}}
aeskey: {{ $secret.data.aeskey }}
{{- else -}}
aeskey: {{ (print "k1.aesgcm256." (randAlphaNum 43) "=") | b64enc }}
{{- end -}}
{{- end -}}