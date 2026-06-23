/**
 * Helper service to calculate BMR, TDEE and target macronutrients
 */
function calculateBmrTdeeMacros({ age, sex, height, weight, activityLevel, goal }) {
  const cleanAge = age ? Number(age) : 28;
  const cleanHeight = height ? Number(height) : 175;
  const cleanWeight = weight ? Number(weight) : 70;
  const cleanSex = sex || 'male';
  const cleanActivity = activityLevel || 'moderately_active';
  const cleanGoal = goal || 'recomposition';

  // Mifflin-St Jeor Equation
  let bmr = 0;
  if (cleanSex === 'male') {
    bmr = (10 * cleanWeight) + (6.25 * cleanHeight) - (5 * cleanAge) + 5;
  } else if (cleanSex === 'female') {
    bmr = (10 * cleanWeight) + (6.25 * cleanHeight) - (5 * cleanAge) - 161;
  } else {
    bmr = (10 * cleanWeight) + (6.25 * cleanHeight) - (5 * cleanAge);
  }

  // TDEE multipliers
  let tdee = bmr;
  switch (cleanActivity) {
    case 'sedentary': tdee *= 1.2; break;
    case 'lightly_active': tdee *= 1.375; break;
    case 'moderately_active': tdee *= 1.55; break;
    case 'very_active': tdee *= 1.725; break;
    case 'super_active': tdee *= 1.9; break;
    default: tdee *= 1.55; break;
  }

  // Goal adjustments
  let calorieTarget = tdee;
  if (cleanGoal === 'cutting') {
    calorieTarget -= 500;
  } else if (cleanGoal === 'bulking') {
    calorieTarget += 500;
  }

  // Macro distribution (30% Protein, 40% Carbs, 30% Fat)
  const proteinTarget = calorieTarget * 0.30 / 4;
  const carbsTarget = calorieTarget * 0.40 / 4;
  const fatsTarget = calorieTarget * 0.30 / 9;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget: Math.round(calorieTarget),
    proteinTarget: Math.round(proteinTarget),
    carbsTarget: Math.round(carbsTarget),
    fatsTarget: Math.round(fatsTarget)
  };
}

module.exports = {
  calculateBmrTdeeMacros
};
