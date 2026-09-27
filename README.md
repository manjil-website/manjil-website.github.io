# saikia.in

Course website for Manjil Saikia (Ahmedabad University), served by GitHub Pages at **https://saikia.in**.
Plain HTML, CSS and JavaScript: no build step, no libraries, nothing to install.

```
index.html            homepage (list of courses)
404.html              "page not found"; also fixes wrong capitals such as /sta102/
CNAME                 tells GitHub Pages the domain is saikia.in
.nojekyll             tells GitHub Pages to serve the files exactly as they are
assets/site.css       colours and layout for the whole site (light and dark)
assets/site.js        theme switch and the Galton board on the homepage
STA102/index.html     course page for STA102 Probability and Random Variables
STA102/BiSem2026/     the STA102 simulations (index.html, 16 pages, assets/, src/, build.py)
```

Addresses on GitHub Pages are case-sensitive. The real ones are `saikia.in/STA102/` and
`saikia.in/STA102/BiSem2026/`; the 404 page redirects other spellings like `saikia.in/sta102/bisem2026/`.

---

## One-time setup

Below, `USERNAME` means your GitHub username.

### 1. Prove to GitHub that you own saikia.in (recommended)

This stops anyone else attaching saikia.in to their own GitHub site.

1. On GitHub, click your profile picture → **Settings** → **Pages** (left sidebar, under *Code, planning, and automation*).
   This is your *account* settings, not a repository's.
2. Click **Add a domain**, type `saikia.in`, and click **Add domain**. GitHub shows a TXT record to create.
3. In GoDaddy (step 2 explains how to reach the DNS page) click **Add New Record**:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | TXT | `_github-pages-challenge-USERNAME` | the code GitHub shows | 1 hour |

   Type only the part before `.saikia.in` in the Name box; GoDaddy adds the domain itself.
4. Back on GitHub click **Verify**. If it fails, wait 15–30 minutes and try again. Leave the TXT record in place permanently.

### 2. Point saikia.in at GitHub in GoDaddy

1. Sign in to GoDaddy → **Domain Portfolio** → click **saikia.in** → open the **DNS** tab (DNS Records).
2. **Delete the existing A record for `@`**. On a new GoDaddy domain it usually says *Parked* or points to a
   GoDaddy/Website Builder address. A leftover record like this is the most common reason the setup fails.
3. Add four **A** records, all with Name `@`:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | A | `@` | `185.199.108.153` | 1 hour |
   | A | `@` | `185.199.109.153` | 1 hour |
   | A | `@` | `185.199.110.153` | 1 hour |
   | A | `@` | `185.199.111.153` | 1 hour |

4. Optional (IPv6): four **AAAA** records with Name `@` and values
   `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
5. Edit the existing **CNAME** record named `www` (GoDaddy points it at `@` by default) so that:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | CNAME | `www` | `USERNAME.github.io` | 1 hour |

   Just the hostname: no `https://`, no path. GitHub will then send www.saikia.in to saikia.in automatically.
6. Leave everything else alone, especially **MX** records and email-related **TXT** records (SPF, DKIM) if you
   use email on this domain. Do not add a wildcard `*` record.
7. If **Forwarding** is set up for saikia.in (a section on the same DNS page, or under Domain Settings), remove it.
   Do not connect the domain to GoDaddy Website Builder, which puts its own A record back.

GoDaddy's own nameservers must be in use (the default). Most changes take effect within an hour;
worldwide it can take up to 48 hours.

### 3. Create the repository and upload the site

1. On GitHub click **New repository**. Name it exactly `USERNAME.github.io`, make it **Public**, and create it.
   (With the free GitHub plan, Pages needs a public repository.)
2. Click **uploading an existing file** (or **Add file → Upload files**). Drag in **everything inside this folder**
   (`index.html`, `404.html`, `CNAME`, `.nojekyll`, `README.md`, and the `assets` and `STA102` folders),
   so that `index.html` sits at the top level of the repository. Click **Commit changes**.
   - On a Mac, `.nojekyll` is hidden; press ⌘⇧. (Command-Shift-full stop) in the file dialog or Finder to show it.
   - If your browser will not take whole folders, use [GitHub Desktop](https://desktop.github.com/) or the git commands below.
3. Open the repository's **Settings** → **Pages**. Under *Build and deployment* choose **Deploy from a branch**,
   branch **main**, folder **/ (root)**, and click **Save**.

With git instead of the web uploader (run inside this folder):

```bash
git init && git add . && git commit -m "saikia.in course site"
git branch -M main
git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
git push -u origin main
```

### 4. Turn on the custom domain and HTTPS

1. Still in the repository's **Settings → Pages**, under **Custom domain** type `saikia.in` and click **Save**.
   (The `CNAME` file you uploaded usually fills this in already.)
2. GitHub runs a DNS check. When it says the DNS check was successful, wait for the HTTPS certificate (usually
   under an hour, occasionally up to 24 hours) and tick **Enforce HTTPS**.
3. Visit https://saikia.in, https://www.saikia.in (it should land on saikia.in) and https://saikia.in/STA102/BiSem2026/.

---

## Updating the site

- Edit a file on GitHub (the pencil icon) or upload a replacement with **Add file → Upload files**. The site
  updates a minute or so after each commit; the **Actions** tab shows the progress.
- To add a course: create a folder named after its code (for example `MAT101/`), copy `STA102/index.html` into it
  as a starting point, copy the course card in `index.html` (the comment there shows where), and add the folder
  to the `KNOWN` list near the top of `404.html` so that lowercase addresses still work.
- A new offering of STA102 goes in its own folder next to `BiSem2026/`, with a panel for it on `STA102/index.html`.

## If something goes wrong

- **"Domain's DNS record could not be retrieved" or "improperly configured"**: DNS has not updated yet, or an old
  `@` record (the GoDaddy *Parked* one) is still there. Check that the only A records for `@` are the four above.
  From a terminal, `dig saikia.in +noall +answer -t A` should list exactly those four addresses.
- **Enforce HTTPS is greyed out**: the certificate is not ready. Wait; if it is still unavailable after a day,
  clear the Custom domain box, save, type `saikia.in` again and save.
- **A page shows 404**: check the capital letters in the address, and that the file is in the repository at that path.
