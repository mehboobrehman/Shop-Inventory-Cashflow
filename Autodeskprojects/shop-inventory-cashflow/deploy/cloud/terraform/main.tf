terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "shop_server" {
  image  = "ubuntu-24-04-x64"
  name   = "shop-inventory-server"
  region = "nyc1"
  size   = "s-1vcpu-1gb"
  ssh_keys = [var.ssh_key_id]
}

resource "digitalocean_firewall" "web_firewall" {
  name = "shop-inventory-firewall"

  droplet_ids = [digitalocean_droplet.shop_server.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

variable "do_token" {
  type      = string
  sensitive = true
}

variable "ssh_key_id" {
  type = string
}
