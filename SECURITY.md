# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it to us by creating a private issue or contacting the maintainers directly.

## Known Security Risks (Accepted)

### Current Status: LOW RISK ✅

The following vulnerabilities are present in build-time dependencies and pose minimal security risk to end users:

### CVE-2023-45863 - glob CLI Command Injection

- **Component**: `tsup` → `sucrase` → `glob` (v10.3.7-11.0.3)
- **Severity**: High
- **Risk Assessment**: LOW
- **Rationale**:
  - Build-time dependency only
  - Requires CLI access to development environment
  - Not exposed in production runtime
- **Mitigation**: Latest available versions installed
- **Status**: Monitoring upstream fixes from `sucrase` maintainers
- **Next Review**: 2025-01-18

### CVE-2024-28849 - phin Header Leakage

- **Component**: `terminal-image` → `jimp` → `phin` (< 3.7.1)
- **Severity**: Moderate
- **Risk Assessment**: LOW
- **Rationale**:
  - Image processing utility only
  - No sensitive headers in CLI context
  - Local development tool usage
- **Mitigation**: Upgraded to `terminal-image@4.1.0` (latest)
- **Status**: Awaiting `jimp` ecosystem updates
- **Next Review**: 2025-01-18

## Security Measures

### Development

- Critical vulnerability scanning in CI/CD (blocks deployment)
- Full security audits run weekly (advisory only)
- Monthly dependency reviews scheduled
- Automated security report generation

### Production

- No vulnerable code paths in runtime
- All vulnerabilities isolated to build/development tools
- User data processing isolated from vulnerable components

## Security Review Schedule

- **Critical vulnerabilities**: Immediate action required
- **High/Moderate in dev dependencies**: Monthly review
- **Full dependency audit**: Quarterly (March, June, September, December)
- **Security policy review**: Semi-annually

## Vulnerability Response Timeline

- **Critical runtime vulnerabilities**: 24 hours
- **High runtime vulnerabilities**: 7 days
- **Development tool vulnerabilities**: Next scheduled release
- **Documentation updates**: With each security review

## Contact

For security concerns, please contact the maintainers through GitHub issues or discussions.

---

**Last Updated**: November 18, 2025  
**Next Review**: January 18, 2025  
**Security Lead**: Development Team
