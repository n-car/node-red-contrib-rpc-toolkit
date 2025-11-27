# Contributing to node-red-contrib-rpc-toolkit

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/n-car/node-red-contrib-rpc-toolkit/issues)
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Node-RED version
   - Node.js version
   - Example flow (if applicable)

### Suggesting Features

1. Check [existing issues](https://github.com/n-car/node-red-contrib-rpc-toolkit/issues) for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Proposed implementation (optional)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Commit with clear messages: `git commit -m "Add feature X"`
7. Push to your fork: `git push origin feature/my-feature`
8. Create a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/node-red-contrib-rpc-toolkit.git
cd node-red-contrib-rpc-toolkit

# Install dependencies
npm install

# Link for development
npm link
cd ~/.node-red
npm link node-red-contrib-rpc-toolkit

# Restart Node-RED
node-red
```

### Testing

```bash
# Run tests
npm test

# Test in Node-RED
# 1. Create a test flow
# 2. Deploy and test functionality
# 3. Check debug output
```

### Code Style

- Use 4 spaces for indentation
- Add comments for complex logic
- Follow existing code patterns
- Keep functions focused and small

### Documentation

- Update README.md for new features
- Add JSDoc comments to functions
- Update CHANGELOG.md
- Include examples for new nodes

## Node Development Guidelines

### Creating New Nodes

1. Create `.js` and `.html` files in `nodes/` directory
2. Register in `package.json` under `node-red.nodes`
3. Follow Node-RED node conventions
4. Include comprehensive help text in HTML
5. Add status indicators
6. Handle errors gracefully

### Node Properties

- Use descriptive property names
- Provide sensible defaults
- Validate inputs
- Support dynamic configuration via `msg` properties

### Testing Nodes

1. Test with various input types
2. Test error conditions
3. Test with other toolkit projects (Express, PHP, .NET, Arduino)
4. Verify status indicators
5. Check memory leaks for long-running flows

## Compatibility

Ensure compatibility with:
- Node-RED 3.0+
- Node.js 14+
- rpc-express-toolkit
- rpc-php-toolkit
- rpc-dotnet-toolkit
- rpc-arduino-toolkit

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Publish to npm: `npm publish`

## Questions?

Open an issue or discussion for questions about contributing.

Thank you for contributing! 🎉
