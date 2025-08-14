resource "google_service_account" "default" {
  account_id   = "dev-vm-service-account"
  display_name = "Custom SA for VM Instance"
}

resource "google_compute_address" "dev" {
  name = "ipv4-address"
}

resource "google_dns_record_set" "user_client" {

  name = "ctrltest.dsp.garvan.org.au."
  type = "A"
  ttl  = 300

  managed_zone = "dsp"
  project = "ctrl-358804"

  rrdatas = [google_compute_address.dev.address]
}

resource "google_dns_record_set" "admin_client" {

  name = "admin.ctrltest.dsp.garvan.org.au."
  type = "A"
  ttl  = 300

  managed_zone = "dsp"
  project = "ctrl-358804"

  rrdatas = [google_compute_address.dev.address]
}

resource "google_compute_instance" "dev" {
  name         = "test-instance"
  machine_type = "e2-standard-2"
  zone         = "australia-southeast1-a"

  tags = ["http-server","https-server"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      size = "20" #GB
    }
  }

  network_interface {
    network = "default"

    access_config {
      nat_ip = google_compute_address.dev.address
    }
  }

  service_account {
    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    email  = google_service_account.default.email
    scopes = ["cloud-platform"]
  }
  metadata_startup_script =  "curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC='server' sh -s - --disable=traefik && curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash && mkdir -p '/opt/ctrl/chart' && chmod -R 777 /opt/ctrl"
}

resource "null_resource" "install_chart" {
  # depends_on = [google_compute_instance.dev] # Ensure K3s master is provisioned

  provisioner "local-exec" {
    command = <<EOT
gcloud --quiet beta compute scp ./dev.yaml ${google_compute_instance.dev.name}:/opt/ctrl/values.yaml  --zone=australia-southeast1-a --project=ctrl-358804 && \
gcloud --quiet beta compute scp --recurse ../.helm/ctrl/ ${google_compute_instance.dev.name}:/opt/ctrl/chart/  --zone=australia-southeast1-a --project=ctrl-358804 && \
gcloud compute ssh --zone australia-southeast1-a ${google_compute_instance.dev.name} --project ctrl-358804 --command "sudo helm install ctrl /opt/ctrl/chart/ctrl -f /opt/ctrl/values.yaml"
EOT
  }
}
