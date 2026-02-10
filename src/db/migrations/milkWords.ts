export const milkWords = [
  "cream",
  "butter",
  "cheese",
  "yogurt",
  "whey",
  "curd",
  "skim",
  "whole",
  "latte",
  "foam",
  "froth",
  "churn",
  "dairy",
  "moo",
  "udder",
  "pasteur",
  "homogen",
  "gallon",
  "pint",
  "quart",
  "splash",
  "pour",
  "drip",
  "swirl",
  "silk",
  "fresh",
  "creamy",
  "rich",
  "smooth",
  "cool",
];

export const generateMilkName = (): string => {
  const shuffled = [...milkWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).join("_");
};
