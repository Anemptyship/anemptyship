# Deployment Setup Instructions

To enable automatic deployment from GitHub to your server:

1.  **Create a GitHub Repository**:
    - Go to GitHub and create a new repository (e.g., `anemptyship`).

2.  **Push your local code**:
    - Run these commands on your server (in `/var/www/anemptyship`):
      ```bash
      git remote add origin https://github.com/YOUR_USERNAME/anemptyship.git
      git branch -M master
      git push -u origin master
      ```

3.  **Setup SSH Access**:
    - IMPORTANT: Ensure you have an SSH key pair. If your server already has one in `~/.ssh/id_rsa` and `~/.ssh/id_rsa.pub`, use that. If not, generate one: `ssh-keygen -t rsa -b 4096`.
    - Add the **Public Key** (`cat ~/.ssh/id_rsa.pub`) to your server's `~/.ssh/authorized_keys` file (if not already there).
    - You will need the **Private Key** for the next step.

4.  **Configure GitHub Secrets**:
    - Go to your Repository Settings -> Secrets and variables -> Actions.
    - Add the following permissions:
      - `HOST`: Your server's IP address or domain.
      - `USERNAME`: The SSH username (likely `ben` or `root`).
      - `SSH_KEY`: The content of your **Private Key** (`cat ~/.ssh/id_rsa`).

5.  **Done!**
    - Now, any commit pushed to the `master` (or `main`) branch on GitHub will automatically trigger the workflow and deploy the changes to your server.
