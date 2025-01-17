resource "google_compute_managed_ssl_certificate" "lb_default" {
  provider = google-beta
  name     = "ctrl-${var.env}-ssl-cert"

  managed {
    domains = ["${var.subdomain}.dsp.garvan.org.au"]
  }
}
