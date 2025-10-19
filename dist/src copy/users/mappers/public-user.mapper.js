"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUser = toPublicUser;
function toPublicUser(user) {
    var _a, _b;
    const plain = typeof user.toObject === 'function' ? user.toObject() : user;
    return {
        id: plain.id || ((_b = (_a = plain._id) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)),
        username: plain.username,
        email: plain.email,
        provider: plain.provider,
        educationSystem: plain.educationSystem,
        grade: plain.grade,
        subject: plain.subject,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
    };
}
//# sourceMappingURL=public-user.mapper.js.map