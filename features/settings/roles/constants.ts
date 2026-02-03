export const RESERVED_ROLE_NAMES = [
    "admin",
    "administrator",
    "super admin",
    "superadmin",
    "system admin",
    "systemadmin",
    "owner",
    "root",
    "moderator",
    "platform admin"
];

export const isReservedName = (name: string): boolean => {
    const normalizedName = name.trim().toLowerCase();
    return RESERVED_ROLE_NAMES.includes(normalizedName);
};
