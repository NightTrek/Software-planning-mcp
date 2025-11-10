# Third-Party Notices

This document contains required attributions for third-party code, libraries, patterns, and resources used in this project.

---

## Direct Dependencies

### @modelcontextprotocol/sdk

**Version**: 0.6.0
**License**: MIT
**Copyright**: Anthropic, PBC
**Source**: https://github.com/modelcontextprotocol/typescript-sdk

**License Text**: [MIT License](https://opensource.org/licenses/MIT)

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Development Dependencies

### TypeScript

**Version**: 5.7.2
**License**: Apache-2.0
**Copyright**: Microsoft Corporation
**Source**: https://github.com/microsoft/TypeScript

**License Text**: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

### @types/node

**Version**: 20.17.11
**License**: MIT
**Copyright**: Microsoft Corporation
**Source**: https://github.com/DefinitelyTyped/DefinitelyTyped

**License Text**: [MIT License](https://opensource.org/licenses/MIT)

---

## Node.js Built-In APIs

### crypto.randomUUID()

**Source**: Node.js Core (v14.17.0+)
**License**: Node.js License (MIT-compatible)
**Documentation**: https://nodejs.org/api/crypto.html
**Usage**: UUID generation for entity IDs (see FIX_QUEUE.json FX-001)

**Attribution**: Node.js is a trademark of Joyent, Inc. and is used with its permission. Node.js is licensed under the [Node.js License](https://github.com/nodejs/node/blob/main/LICENSE).

---

## Pattern References (No Direct Code Use)

### OWASP Input Validation Cheat Sheet

**Source**: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
**License**: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
**Copyright**: OWASP Foundation
**Usage**: Reference for input validation patterns (see PROVENANCE_MANIFEST.json SRC-002)

**Attribution**: This project references input validation best practices from the OWASP Cheat Sheet Series. No code is directly copied; implementations are original work guided by OWASP security principles.

**Note**: Under CC BY-SA 4.0, we are required to:
- ✅ Give appropriate credit (done above)
- ✅ Provide a link to the license (https://creativecommons.org/licenses/by-sa/4.0/)
- ✅ Indicate if changes were made (our implementation is original, not a derivative)

We have not created derivative works of OWASP documentation. We have created original implementations inspired by documented security patterns.

---

## Transitive Dependencies

All transitive dependencies (sub-dependencies of packages listed above) include their own license files in `node_modules/`. Key transitive dependencies include:

- **bytes** (MIT)
- **content-type** (MIT)
- **depd** (MIT)
- **http-errors** (MIT)
- **iconv-lite** (MIT)
- **inherits** (ISC)
- **json-pointer** (MIT)
- **json-schema** (BSD-3-Clause)
- **media-typer** (MIT)
- **ms** (MIT)
- **qs** (BSD-3-Clause)
- **raw-body** (MIT)
- **safe-buffer** (MIT)
- **safer-buffer** (MIT)
- **setprototypeof** (ISC)
- **statuses** (MIT)
- **toidentifier** (MIT)
- **undici** (MIT)

For complete dependency tree, run:
```bash
pnpm licenses list
```

---

## Proposed Future Dependencies (Not Yet Added)

### Vitest (for FX-012)

**License**: MIT
**Source**: https://github.com/vitest-dev/vitest
**Status**: Proposed for v0.2.0

**License Text**: [MIT License](https://github.com/vitest-dev/vitest/blob/main/LICENSE)

### pino (for FX-010)

**License**: MIT
**Source**: https://github.com/pinojs/pino
**Status**: Proposed for v0.2.0

**License Text**: [MIT License](https://github.com/pinojs/pino/blob/master/LICENSE)

### proper-lockfile (for FX-008)

**License**: MIT OR Unlicense
**Source**: https://github.com/moxystudio/node-proper-lockfile
**Status**: Proposed for v0.2.0

**License Text**: [MIT License](https://github.com/moxystudio/node-proper-lockfile/blob/master/LICENSE)

---

## Trademark Notices

- **Node.js** is a trademark of Joyent, Inc.
- **TypeScript** is a trademark of Microsoft Corporation
- **Claude** is a trademark of Anthropic, PBC
- **MCP (Model Context Protocol)** is developed by Anthropic, PBC

---

## Attribution Requirements

### For MIT Licensed Code

When using MIT-licensed dependencies, the license text must be included in distributions. All MIT dependencies in `node_modules/` include their LICENSE files, which are preserved during `pnpm install`.

### For Apache-2.0 Licensed Code

TypeScript (Apache-2.0) requires:
- ✅ Copy of Apache License included (see node_modules/typescript/LICENSE.txt)
- ✅ Attribution notice preserved
- ✅ Statement of significant changes (N/A - using as-is)

### For Creative Commons Attribution-ShareAlike 4.0

OWASP Cheat Sheets (CC BY-SA 4.0) require:
- ✅ Attribution to OWASP Foundation
- ✅ Link to license: https://creativecommons.org/licenses/by-sa/4.0/
- ✅ Indication of changes: Our implementations are original, not derivatives

---

## License Compatibility Matrix

| Our License | Dependency License | Compatible? | Notes |
|-------------|-------------------|-------------|-------|
| MIT | MIT | ✅ Yes | Fully compatible |
| MIT | Apache-2.0 | ✅ Yes | Can use Apache code in MIT project |
| MIT | ISC | ✅ Yes | ISC is functionally identical to MIT |
| MIT | BSD-3-Clause | ✅ Yes | Compatible, requires attribution |
| MIT | CC BY-SA 4.0 | ✅ Yes* | *For patterns/docs only, not code |

**Conclusion**: All dependencies and references are compatible with our MIT license.

---

## Compliance Verification

To verify license compliance at any time:

```bash
# List all licenses
pnpm licenses list

# Generate detailed license report
pnpm licenses list --json > licenses.json

# Check for problematic licenses (GPL, LGPL, etc.)
pnpm licenses list | grep -E "GPL|LGPL|AGPL"
# Should return empty (none found)
```

---

## Updates to This Document

When adding new dependencies:

1. Add to appropriate section above
2. Include license type, copyright, and source URL
3. Verify license compatibility with MIT
4. Update PROVENANCE_MANIFEST.json if code is integrated
5. Run `pnpm licenses list` to verify

---

## Questions or Issues

If you believe any attribution is missing or incorrect, please:
1. Open an issue at: https://github.com/yourusername/Software-planning-mcp/issues
2. Tag with `legal` or `licensing`
3. Provide specific details about the missing attribution

---

**Document Version**: 1.0
**Last Updated**: 2025-11-10
**Next Review**: Before v0.2.0 or when adding new dependencies
