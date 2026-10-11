export const MIN_LENGTH = 2;
export const MAX_LENGTH = 255;
// Largest values the decimal columns hold; above them MySQL rejects the write
export const NUTRIENT_MAX = 999_999_999.9; // decimal(10,1)
export const QUANTITY_MAX = 99_999_999.99; // decimal(10,2)
