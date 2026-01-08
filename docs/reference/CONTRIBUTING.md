# Contributing to NEXUS V1

First off, thanks for taking the time to contribute! 🎉

## 🛠️ Development Workflow

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/nexus-v1.git
   cd nexus-v1/backend
   ```

2. **Install Dependencies**
   We use `npm` for dependency management.
   ```bash
   npm install
   ```

3. **Check Environment Health**
   Use our custom Sentinel tool to ensure your environment is ready.
   ```bash
   npm run nexus:doctor
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

## 🧪 Testing
Please ensure all tests pass before submitting a PR.
```bash
npm test
```

## 📝 Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- `feat: allow provided config object to extend other configs`
- `fix: array parsing issue when multiple spaces were contained in string`
- `docs: correct spelling of CHANGELOG`

## 🩹 Troubleshooting
If you run into dependency issues, use the Healer:
```bash
npm run nexus:heal
```
