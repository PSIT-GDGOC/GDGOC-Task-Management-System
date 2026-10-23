# Supabase database CA

`supabase-ca.crt` is the public Supabase Root 2021 CA, downloaded from the club
project's Database Settings → SSL configuration on 23 October 2026. It contains
no password or private key. It expires on 26 April 2031.

SHA-256: `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`.

The PostgreSQL session driver uses this CA only for Supabase database hosts and
keeps certificate and hostname verification enabled. Keep this directory in the
deployment checkout. Review and replace the certificate when the provider rotates
its CA. See https://supabase.com/docs/guides/database/connecting-to-postgres.
