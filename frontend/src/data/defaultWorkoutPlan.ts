export type PlannerExercise = {
  name: string;
  targetMuscles: string[];
  instructions: string[];
  commonMistakes: string[];
  sets: number;
  reps: string;
  difficulty: string;
  progression?: string;
};

export type WorkoutDay = {
  dayName: string;
  focus: string;
  estimatedMinutes: number;
  exercises: PlannerExercise[];
};

export type WorkoutPlan = {
  _id?: string;
  planId?: string;
  name: string;
  goal: string;
  split: string;
  experienceLevel: string;
  weeklySchedule: WorkoutDay[];
  volumeSummary: Record<string, number>;
  progressionRules: string[];
  recoveryGuidance: string[];
  muscleBalance: string;
  workoutDays?: number[];
  exercises?: PlannerExercise[];
  isCustom?: boolean;
};

export type SetLog = {
  weight: number;
  reps: number;
  completed: boolean;
  setType?: 'normal' | 'superset' | 'dropset';
};

export type ExerciseLog = {
  name: string;
  sets: SetLog[];
};

export const DEFAULT_WORKOUT_PLAN: WorkoutPlan = {
  name: "Upper Lower Overload Split",
  goal: "hypertrophy",
  split: "upper_lower",
  experienceLevel: "intermediate",
  weeklySchedule: [
    {
      dayName: "Monday",
      focus: "Upper A (Strength/Hypertrophy)",
      estimatedMinutes: 70,
      exercises: [
        {
          name: "Barbell Bench Press",
          targetMuscles: ["chest", "triceps", "shoulders"],
          instructions: [
            "Lie flat on the bench, squeeze shoulder blades together, plant feet firmly.",
            "Lower the bar under control to your lower chest/sternum.",
            "Push the bar back up in a slight diagonal arch to locked position."
          ],
          commonMistakes: [
            "Bouncing the bar off the chest",
            "Flaring elbows to 90 degrees"
          ],
          sets: 3,
          reps: "8-12",
          difficulty: "intermediate",
          progression: "Scale weight when all sets reach 12 reps."
        },
        {
          name: "Barbell Row",
          targetMuscles: ["back", "biceps", "rear delts"],
          instructions: [
            "Hinge at the hips keeping a neutral spine.",
            "Pull the bar towards your belly button.",
            "Squeeze lats and upper back at peak contraction."
          ],
          commonMistakes: [
            "Rounding the lumbar spine",
            "Using momentum to swing the bar"
          ],
          sets: 3,
          reps: "8-12",
          difficulty: "intermediate"
        },
        {
          name: "Incline Dumbbell Press",
          targetMuscles: ["upper chest", "shoulders"],
          instructions: [
            "Sit on an incline bench set to 30 degrees.",
            "Lower dumbbells to upper chest level.",
            "Press dumbbells vertically without letting them touch."
          ],
          commonMistakes: [
            "Using an incline that is too steep",
            "Clashing weights at lockout"
          ],
          sets: 3,
          reps: "10-15",
          difficulty: "intermediate"
        },
        {
          name: "Dumbbell Lateral Raise",
          targetMuscles: ["shoulders"],
          instructions: [
            "Stand tall, raise dumbbells outwards with a slight forward angle.",
            "Lead with your elbows to maximum tension height."
          ],
          commonMistakes: [
            "Using heavy weights and swinging",
            "Lifting hands higher than elbows"
          ],
          sets: 3,
          reps: "12-15",
          difficulty: "intermediate"
        }
      ]
    },
    {
      dayName: "Tuesday",
      focus: "Lower A (Squat/Posterior)",
      estimatedMinutes: 70,
      exercises: [
        {
          name: "Barbell Back Squat",
          targetMuscles: ["quadriceps", "glutes", "hamstrings"],
          instructions: [
            "Set feet shoulder-width, bar resting on traps.",
            "Descend by breaking at hips and knees, tracking knees outward.",
            "Go down to parallel, drive up from mid-foot."
          ],
          commonMistakes: [
            "Knees caving inwards",
            "Heels raising off the floor"
          ],
          sets: 3,
          reps: "6-10",
          difficulty: "intermediate",
          progression: "Scale weight when all sets reach 10 reps."
        },
        {
          name: "Barbell Romanian Deadlift (RDL)",
          targetMuscles: ["hamstrings", "glutes", "lower back"],
          instructions: [
            "Hold bar at hip height, hinge at hips pulling thighs back.",
            "Lower bar down shins until a deep stretch is felt.",
            "Drive hips forward to return to standing."
          ],
          commonMistakes: [
            "Rounding the spine",
            "Lowering bar too fast"
          ],
          sets: 3,
          reps: "8-12",
          difficulty: "intermediate"
        },
        {
          name: "Dumbbell Walking Lunge",
          targetMuscles: ["quadriceps", "glutes"],
          instructions: [
            "Step forward, drop hips straight down.",
            "Push through front heel to step into next rep."
          ],
          commonMistakes: [
            "Torso leaning too far forward",
            "Knee crossing past toes excessively"
          ],
          sets: 3,
          reps: "10-12 per leg",
          difficulty: "intermediate"
        }
      ]
    },
    {
      dayName: "Thursday",
      focus: "Upper B (Press/Pull)",
      estimatedMinutes: 70,
      exercises: [
        {
          name: "Barbell Overhead Press",
          targetMuscles: ["shoulders", "triceps"],
          instructions: [
            "Press bar straight overhead, pull face back slightly to clear bar.",
            "Lockout bar overhead aligned with ears."
          ],
          commonMistakes: [
            "Arching lower back excessively",
            "Bending knees for leg drive"
          ],
          sets: 3,
          reps: "6-10",
          difficulty: "intermediate"
        },
        {
          name: "Cable Lat Pulldown",
          targetMuscles: ["back", "biceps"],
          instructions: [
            "Pull bar down to upper collarbone, driving elbows down.",
            "Extend arms back up to full stretch."
          ],
          commonMistakes: [
            "Leaning back excessively",
            "Pulling down with hands, not elbows"
          ],
          sets: 3,
          reps: "8-12",
          difficulty: "intermediate"
        },
        {
          name: "Standing Cable Fly",
          targetMuscles: ["chest", "triceps"],
          instructions: [
            "Grasp handles and step forward in a staggered stance, leaning slightly forward.",
            "With a slight bend in your elbows, sweep your arms forward in a wide arc until hands meet.",
            "Slowly reverse the movement back to the starting point, feeling a stretch in your chest."
          ],
          commonMistakes: [
            "Pressing the weight instead of flying.",
            "Letting elbows bend too much.",
            "Using momentum or swinging torso."
          ],
          sets: 3,
          reps: "10-15",
          difficulty: "intermediate"
        },
        {
          name: "Cable Face Pull",
          targetMuscles: ["shoulders", "upper back"],
          instructions: [
            "Pull rope toward face, flaring elbows high.",
            "Squeeze rear delts and rotators."
          ],
          commonMistakes: [
            "Using too much weight",
            "Dropping elbows down"
          ],
          sets: 3,
          reps: "15-20",
          difficulty: "intermediate"
        }
      ]
    },
    {
      dayName: "Friday",
      focus: "Lower B (Deadlift/Anterior)",
      estimatedMinutes: 70,
      exercises: [
        {
          name: "Conventional Barbell Deadlift",
          targetMuscles: ["hamstrings", "glutes", "back"],
          instructions: [
            "Pull bar into shins, flatten lower back, brace core.",
            "Drive feet into floor to pull bar vertically to hip lockout."
          ],
          commonMistakes: [
            "Rounding the spine",
            "Bar path drifting forward"
          ],
          sets: 3,
          reps: "5 reps",
          difficulty: "intermediate",
          progression: "Double check spinal alignment under heavy load."
        },
        {
          name: "Sled Leg Press",
          targetMuscles: ["quadriceps", "glutes"],
          instructions: [
            "Lower sled platform until knees are bent to 90 degrees.",
            "Drive sled upward without locking knees."
          ],
          commonMistakes: [
            "Tailbone lifting off padding",
            "Locking knees out violently"
          ],
          sets: 3,
          reps: "10-12",
          difficulty: "intermediate"
        },
        {
          name: "Hanging Leg Raise",
          targetMuscles: ["abs"],
          instructions: [
            "Hang from pull-up bar, raise straight legs to parallel.",
            "Lower legs slowly avoiding swinging motion."
          ],
          commonMistakes: [
            "Using momentum to swing",
            "Dangling shoulders"
          ],
          sets: 3,
          reps: "12-15",
          difficulty: "intermediate"
        }
      ]
    }
  ],
  volumeSummary: { "chest": 9, "back": 6, "legs": 9, "shoulders": 9 },
  progressionRules: [
    "Increase load when you complete all sets at the high-end rep target.",
    "Deload by 10% weight if performance stalls for 2 consecutive weeks."
  ],
  recoveryGuidance: [
    "Ensure 8 hours of high quality sleep for optimal central nervous system recovery.",
    "Consume 2.0g protein per kg of lean body mass."
  ],
  muscleBalance: "Highly balanced upper/lower push/pull volume."
};
