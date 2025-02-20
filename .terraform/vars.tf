variable "name" {
  description = "Base name to derive everythign else from"
  default     = "ctrl"
  type        = string
}

variable "project" {
  description = "GCP Project ID"
  default = "ctrl-358804"
  type        = string
  nullable    = false
}

variable "repo" {
  description = "GitHub Repo"
  default = "ctrl-next"
  type        = string
  nullable    = false
}

variable "owner" {
  description = "GitHub Repo Owner"
  default = "Garvan-Data-Science-Platform"
  type        = string
  nullable    = false
}