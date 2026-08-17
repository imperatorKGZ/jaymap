export interface ValidationIssue {
  field: string;
  code:
    | "invalid_number"
    | "negative"
    | "min_greater_than_max"
    | "invalid_integer"
    | "invalid_rooms"
    | "invalid_date_range"
    | "invalid_guests"
    | "invalid_value";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  );
}

function toNumber(value: unknown): number | null {
  if (isEmpty(value)) {
    return null;
  }

  const normalized = String(value)
    .replace(/[\s\u00A0\u202F]/g, "")
    .replace(",", ".")
    .trim();

  if (!normalized) {
    return null;
  }

  const number = Number(normalized);

  return Number.isFinite(number)
    ? number
    : null;
}

function toInteger(value: unknown): number | null {
  const number = toNumber(value);

  if (number === null) {
    return null;
  }

  return Number.isInteger(number)
    ? number
    : null;
}

function validateOptionalNumber(
  issues: ValidationIssue[],
  field: string,
  value: unknown
): number | null {
  if (isEmpty(value)) {
    return null;
  }

  const number = toNumber(value);

  if (number === null) {
    issues.push({
      field,
      code: "invalid_number",
      message: `${field} must be a valid number`,
    });

    return null;
  }

  if (number < 0) {
    issues.push({
      field,
      code: "negative",
      message: `${field} cannot be negative`,
    });

    return null;
  }

  return number;
}

function validateOptionalInteger(
  issues: ValidationIssue[],
  field: string,
  value: unknown
): number | null {
  if (isEmpty(value)) {
    return null;
  }

  const number = toInteger(value);

  if (number === null) {
    issues.push({
      field,
      code: "invalid_integer",
      message: `${field} must be a whole number`,
    });

    return null;
  }

  if (number < 0) {
    issues.push({
      field,
      code: "negative",
      message: `${field} cannot be negative`,
    });

    return null;
  }

  return number;
}

function validateOptionalRange(
  issues: ValidationIssue[],
  minField: string,
  minValue: unknown,
  maxField: string,
  maxValue: unknown
): void {
  const min = toNumber(minValue);
  const max = toNumber(maxValue);

  // Один край диапазона может быть пустым.
  if (min === null || max === null) {
    return;
  }

  if (min > max) {
    issues.push({
      field: minField,
      code: "min_greater_than_max",
      message: `${minField} cannot be greater than ${maxField}`,
    });
  }
}

export function validateRentalFilters(
  values: Record<string, unknown>
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const rooms = validateOptionalInteger(
    issues,
    "rooms",
    values.rooms
  );

  if (
    rooms !== null &&
    (rooms < 0 || rooms > 20)
  ) {
    issues.push({
      field: "rooms",
      code: "invalid_rooms",
      message: "rooms value is out of allowed range",
    });
  }

  validateOptionalNumber(
    issues,
    "priceMin",
    values.priceMin
  );

  validateOptionalNumber(
    issues,
    "priceMax",
    values.priceMax
  );

  validateOptionalNumber(
    issues,
    "areaMin",
    values.areaMin
  );

  validateOptionalNumber(
    issues,
    "areaMax",
    values.areaMax
  );

  validateOptionalInteger(
    issues,
    "floorMin",
    values.floorMin
  );

  validateOptionalInteger(
    issues,
    "floorMax",
    values.floorMax
  );

  validateOptionalRange(
    issues,
    "priceMin",
    values.priceMin,
    "priceMax",
    values.priceMax
  );

  validateOptionalRange(
    issues,
    "areaMin",
    values.areaMin,
    "areaMax",
    values.areaMax
  );

  validateOptionalRange(
    issues,
    "floorMin",
    values.floorMin,
    "floorMax",
    values.floorMax
  );

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function validateCommercialFilters(
  values: Record<string, unknown>
): ValidationResult {
  const issues: ValidationIssue[] = [];

  validateOptionalNumber(
    issues,
    "areaMin",
    values.areaMin
  );

  validateOptionalNumber(
    issues,
    "areaMax",
    values.areaMax
  );

  validateOptionalNumber(
    issues,
    "ratePerSqm",
    values.ratePerSqm
  );

  validateOptionalRange(
    issues,
    "areaMin",
    values.areaMin,
    "areaMax",
    values.areaMax
  );

  if (
    values.purpose !== undefined &&
    values.purpose !== null &&
    !Array.isArray(values.purpose)
  ) {
    issues.push({
      field: "purpose",
      code: "invalid_value",
      message: "purpose must be an array",
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function validateLandFilters(
  values: Record<string, unknown>
): ValidationResult {
  const issues: ValidationIssue[] = [];

  validateOptionalNumber(
    issues,
    "areaSotMin",
    values.areaSotMin
  );

  validateOptionalNumber(
    issues,
    "areaSotMax",
    values.areaSotMax
  );

  validateOptionalRange(
    issues,
    "areaSotMin",
    values.areaSotMin,
    "areaSotMax",
    values.areaSotMax
  );

  if (
    values.utilities !== undefined &&
    values.utilities !== null &&
    !Array.isArray(values.utilities)
  ) {
    issues.push({
      field: "utilities",
      code: "invalid_value",
      message: "utilities must be an array",
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function validateDailyFilters(
  values: Record<string, unknown>
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const checkIn = isEmpty(values.checkIn)
    ? null
    : String(values.checkIn).trim();

  const checkOut = isEmpty(values.checkOut)
    ? null
    : String(values.checkOut).trim();

  if (
    checkIn &&
    checkOut &&
    checkIn >= checkOut
  ) {
    issues.push({
      field: "checkOut",
      code: "invalid_date_range",
      message: "checkOut must be after checkIn",
    });
  }

  if (!isEmpty(values.guests)) {
    const guests = toInteger(
      values.guests
    );

    if (guests === null) {
      issues.push({
        field: "guests",
        code: "invalid_guests",
        message: "guests must be a whole number",
      });
    } else if (guests < 1 || guests > 100) {
      issues.push({
        field: "guests",
        code: "invalid_guests",
        message: "guests value is out of allowed range",
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function validateWorkspaceFilters(
  sectionId: string,
  values: Record<string, unknown>
): ValidationResult {
  switch (sectionId) {
    case "rental":
      return validateRentalFilters(values);

    case "commercial":
      return validateCommercialFilters(values);

    case "land":
      return validateLandFilters(values);

    case "daily":
      return validateDailyFilters(values);

    default:
      return {
        valid: true,
        issues: [],
      };
  }
}