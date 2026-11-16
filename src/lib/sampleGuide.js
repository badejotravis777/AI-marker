// A sample test teachers can edit on the Guide page.
export const SAMPLE_GUIDE = {
  id: "sample-jss2-basic-science",
  title: "First Term Test",
  subject: "Basic Science",
  classLevel: "JSS2",
  questions: [
    {
      number: "1",
      question: "What is a balanced diet?",
      maxMarks: 2,
      answer:
        "A diet that contains all the classes of food (nutrients) (1 mark) in the right proportions or amounts (1 mark).",
    },
    {
      number: "2",
      question: "Name the three states of matter.",
      maxMarks: 3,
      answer: "Solid (1), liquid (1), gas (1). Spelling mistakes are fine if the meaning is clear.",
    },
    {
      number: "3",
      question: "State two ways of preventing malaria.",
      maxMarks: 2,
      answer:
        "Any two, 1 mark each: sleeping under an insecticide-treated mosquito net; clearing bushes around the house; draining or covering stagnant water; using insect repellent or insecticide; taking antimalarial drugs as prescribed.",
    },
    {
      number: "4",
      question: "What is the function of the heart?",
      maxMarks: 1,
      answer: "It pumps blood round the body (to all parts of the body).",
    },
    {
      number: "5",
      question: "Give one example each of a renewable and a non-renewable source of energy.",
      maxMarks: 2,
      answer:
        "Renewable, 1 mark: solar, wind, water (hydro) or biomass/firewood. Non-renewable, 1 mark: coal, crude oil (petroleum) or natural gas.",
    },
  ],
};

// Shown only when someone taps "See an example". It is clearly labelled as an example.
export const EXAMPLE_RESULT = {
  studentName: "Chidinma Okafor",
  score: 8.5,
  maxScore: 10,
  overallComment:
    "Good work, Chidinma. You know your states of matter and energy sources well. Revise what makes a diet balanced.",
  questions: [
    {
      number: "1",
      maxMarks: 2,
      awarded: 1,
      studentAnswer: "A diet that contain all the class of food",
      feedback: "Correct start. Also say the foods must be in the right amounts.",
      needsReview: false,
    },
    {
      number: "2",
      maxMarks: 3,
      awarded: 3,
      studentAnswer: "solid, liquid and gass",
      feedback: "All three states are correct.",
      needsReview: false,
    },
    {
      number: "3",
      maxMarks: 2,
      awarded: 2,
      studentAnswer: "Sleep inside mosquito net. Clear the bush around the house",
      feedback: "Two good ways to prevent malaria.",
      needsReview: false,
    },
    {
      number: "4",
      maxMarks: 1,
      awarded: 0.5,
      studentAnswer: "it pump [unclear]",
      feedback: "Say what the heart pumps and where it sends it.",
      needsReview: true,
    },
    {
      number: "5",
      maxMarks: 2,
      awarded: 2,
      studentAnswer: "Renewable - solar. Non renewable - coal",
      feedback: "Both examples are correct.",
      needsReview: false,
    },
  ],
};
