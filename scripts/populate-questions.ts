import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function populateQuestions() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('📚 Populating SAT practice questions...\n');

    const mathQuestions = [
      {
        question_text: 'If 3x + 7 = 22, what is the value of x?',
        subject: 'Math',
        option_a: '5',
        option_b: '6',
        option_c: '7',
        option_d: '8',
        correct_answer: 'A',
        explanation: 'Subtract 7 from both sides: 3x = 15. Then divide both sides by 3: x = 5.',
        hint: 'Start by isolating the term with x by subtracting 7 from both sides.'
      },
      {
        question_text: 'A rectangle has a length of 12 cm and a width of 8 cm. What is its area in square centimeters?',
        subject: 'Math',
        option_a: '20',
        option_b: '40',
        option_c: '96',
        option_d: '192',
        correct_answer: 'C',
        explanation: 'The area of a rectangle is length × width. So 12 × 8 = 96 square centimeters.',
        hint: 'Remember the formula: Area = length × width'
      },
      {
        question_text: 'If y = 2x + 3 and x = 4, what is the value of y?',
        subject: 'Math',
        option_a: '8',
        option_b: '10',
        option_c: '11',
        option_d: '15',
        correct_answer: 'C',
        explanation: 'Substitute x = 4 into the equation: y = 2(4) + 3 = 8 + 3 = 11.',
        hint: 'Replace x with 4 in the equation and solve.'
      },
      {
        question_text: 'What is 25% of 80?',
        subject: 'Math',
        option_a: '15',
        option_b: '20',
        option_c: '25',
        option_d: '30',
        correct_answer: 'B',
        explanation: '25% means 25/100 or 0.25. So 0.25 × 80 = 20.',
        hint: 'Convert the percentage to a decimal and multiply.'
      },
      {
        question_text: 'In a right triangle, if one leg is 3 units and the other leg is 4 units, what is the length of the hypotenuse?',
        subject: 'Math',
        option_a: '5',
        option_b: '6',
        option_c: '7',
        option_d: '12',
        correct_answer: 'A',
        explanation: 'Using the Pythagorean theorem: a² + b² = c². So 3² + 4² = 9 + 16 = 25. Therefore c = √25 = 5.',
        hint: 'Use the Pythagorean theorem: a² + b² = c²'
      },
      {
        question_text: 'If f(x) = x² - 4x + 3, what is f(2)?',
        subject: 'Math',
        option_a: '-1',
        option_b: '0',
        option_c: '1',
        option_d: '3',
        correct_answer: 'A',
        explanation: 'Substitute x = 2: f(2) = (2)² - 4(2) + 3 = 4 - 8 + 3 = -1.',
        hint: 'Replace every x in the function with 2 and simplify.'
      },
      {
        question_text: 'What is the slope of the line passing through points (2, 3) and (6, 11)?',
        subject: 'Math',
        option_a: '1',
        option_b: '2',
        option_c: '3',
        option_d: '4',
        correct_answer: 'B',
        explanation: 'Slope = (y₂ - y₁)/(x₂ - x₁) = (11 - 3)/(6 - 2) = 8/4 = 2.',
        hint: 'Use the slope formula: (change in y)/(change in x)'
      },
      {
        question_text: 'A store offers a 20% discount on a $60 item. What is the sale price?',
        subject: 'Math',
        option_a: '$12',
        option_b: '$40',
        option_c: '$48',
        option_d: '$50',
        correct_answer: 'C',
        explanation: 'The discount is 20% of $60 = $12. The sale price is $60 - $12 = $48.',
        hint: 'Calculate the discount amount, then subtract it from the original price.'
      },
      {
        question_text: 'If 2x - 5 < 9, what is the largest integer value of x?',
        subject: 'Math',
        option_a: '5',
        option_b: '6',
        option_c: '7',
        option_d: '8',
        correct_answer: 'B',
        explanation: 'Add 5 to both sides: 2x < 14. Divide by 2: x < 7. The largest integer less than 7 is 6.',
        hint: 'Solve the inequality like an equation, keeping the inequality sign.'
      },
      {
        question_text: 'What is the value of (3² + 4²) ÷ 5?',
        subject: 'Math',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_answer: 'C',
        explanation: '3² = 9 and 4² = 16. So (9 + 16) ÷ 5 = 25 ÷ 5 = 5.',
        hint: 'First calculate the squares, then add them, then divide.'
      },
      {
        question_text: 'A circular garden has a radius of 7 meters. What is its approximate area? (Use π ≈ 3.14)',
        subject: 'Math',
        option_a: '44 m²',
        option_b: '88 m²',
        option_c: '154 m²',
        option_d: '308 m²',
        correct_answer: 'C',
        explanation: 'Area of a circle = πr². So A = 3.14 × 7² = 3.14 × 49 ≈ 154 m².',
        hint: 'Use the formula A = πr² where r is the radius.'
      },
      {
        question_text: 'If x/4 = 12, what is the value of x?',
        subject: 'Math',
        option_a: '3',
        option_b: '8',
        option_c: '16',
        option_d: '48',
        correct_answer: 'D',
        explanation: 'Multiply both sides by 4: x = 12 × 4 = 48.',
        hint: 'Multiply both sides by the denominator to isolate x.'
      },
      {
        question_text: 'What is the median of the set {3, 7, 2, 9, 5}?',
        subject: 'Math',
        option_a: '3',
        option_b: '5',
        option_c: '7',
        option_d: '9',
        correct_answer: 'B',
        explanation: 'First arrange in order: {2, 3, 5, 7, 9}. The middle value is 5.',
        hint: 'Arrange the numbers in order from smallest to largest, then find the middle value.'
      },
      {
        question_text: 'If y varies directly with x, and y = 15 when x = 3, what is y when x = 7?',
        subject: 'Math',
        option_a: '21',
        option_b: '28',
        option_c: '35',
        option_d: '42',
        correct_answer: 'C',
        explanation: 'Direct variation means y = kx. Find k: 15 = k(3), so k = 5. Then y = 5(7) = 35.',
        hint: 'Find the constant of variation first using the given values.'
      },
      {
        question_text: 'What is the x-intercept of the line 2x + 3y = 12?',
        subject: 'Math',
        option_a: '(4, 0)',
        option_b: '(6, 0)',
        option_c: '(0, 4)',
        option_d: '(0, 6)',
        correct_answer: 'B',
        explanation: 'At the x-intercept, y = 0. Substitute: 2x + 3(0) = 12, so 2x = 12, x = 6. The point is (6, 0).',
        hint: 'The x-intercept occurs when y = 0. Substitute and solve for x.'
      },
      {
        question_text: 'A box contains 5 red balls and 3 blue balls. What is the probability of randomly selecting a red ball?',
        subject: 'Math',
        option_a: '3/8',
        option_b: '5/8',
        option_c: '3/5',
        option_d: '5/3',
        correct_answer: 'B',
        explanation: 'Probability = (favorable outcomes)/(total outcomes) = 5/(5+3) = 5/8.',
        hint: 'Divide the number of red balls by the total number of balls.'
      },
      {
        question_text: 'If 3(x - 2) = 21, what is x?',
        subject: 'Math',
        option_a: '5',
        option_b: '7',
        option_c: '9',
        option_d: '11',
        correct_answer: 'C',
        explanation: 'Divide both sides by 3: x - 2 = 7. Add 2 to both sides: x = 9.',
        hint: 'First divide both sides by 3, then solve for x.'
      },
      {
        question_text: 'What is the sum of the interior angles of a pentagon?',
        subject: 'Math',
        option_a: '360°',
        option_b: '450°',
        option_c: '540°',
        option_d: '720°',
        correct_answer: 'C',
        explanation: 'The formula is (n - 2) × 180° where n is the number of sides. For a pentagon: (5 - 2) × 180° = 540°.',
        hint: 'Use the formula (n - 2) × 180° where n = 5.'
      },
      {
        question_text: 'If the average of 4 numbers is 15, what is their sum?',
        subject: 'Math',
        option_a: '45',
        option_b: '50',
        option_c: '55',
        option_d: '60',
        correct_answer: 'D',
        explanation: 'Average = Sum/Count, so 15 = Sum/4. Therefore Sum = 15 × 4 = 60.',
        hint: 'Multiply the average by the count of numbers.'
      },
      {
        question_text: 'What is the value of |−8|?',
        subject: 'Math',
        option_a: '-8',
        option_b: '0',
        option_c: '8',
        option_d: '16',
        correct_answer: 'C',
        explanation: 'The absolute value of a number is its distance from zero, always positive. So |−8| = 8.',
        hint: 'Absolute value is always the positive version of a number.'
      }
    ];

    const readingWritingQuestions = [
      {
        question_text: 'Which word best completes the sentence?\n\nThe scientist\'s findings were _____, contradicting decades of accepted research.\n',
        subject: 'Reading/Writing',
        option_a: 'conventional',
        option_b: 'revolutionary',
        option_c: 'redundant',
        option_d: 'trivial',
        correct_answer: 'B',
        explanation: '"Revolutionary" best fits because the findings contradict accepted research, meaning they represent a major change or breakthrough.',
        hint: 'Look for a word that suggests something new and contradictory to what was previously believed.'
      },
      {
        question_text: 'Which sentence is grammatically correct?',
        subject: 'Reading/Writing',
        option_a: 'Neither of the students were prepared for the exam.',
        option_b: 'Neither of the students was prepared for the exam.',
        option_c: 'Neither of the students are prepared for the exam.',
        option_d: 'Neither of the students been prepared for the exam.',
        correct_answer: 'B',
        explanation: '"Neither" is singular, so it requires the singular verb "was." The phrase "of the students" doesn\'t change this rule.',
        hint: '"Neither" is always treated as singular and takes a singular verb.'
      },
      {
        question_text: 'The author uses the phrase "a double-edged sword" to suggest that technology:\n\nText: "Social media is a double-edged sword: it connects us globally while simultaneously isolating us locally."',
        subject: 'Reading/Writing',
        option_a: 'is completely beneficial',
        option_b: 'has both positive and negative effects',
        option_c: 'is primarily dangerous',
        option_d: 'should be avoided entirely',
        correct_answer: 'B',
        explanation: 'A "double-edged sword" is an idiom meaning something has both advantages and disadvantages, which matches the description of connecting globally but isolating locally.',
        hint: 'The idiom "double-edged sword" refers to something with two opposite effects.'
      },
      {
        question_text: 'Which transition word best connects these two sentences?\n\nThe team practiced diligently for months. _____, they won the championship.',
        subject: 'Reading/Writing',
        option_a: 'However',
        option_b: 'Consequently',
        option_c: 'Meanwhile',
        option_d: 'Nevertheless',
        correct_answer: 'B',
        explanation: '"Consequently" shows cause and effect: their practice led to winning. The other options don\'t show this logical connection.',
        hint: 'The second sentence is a result of the first. Choose a word that shows cause and effect.'
      },
      {
        question_text: 'Which sentence correctly uses a semicolon?',
        subject: 'Reading/Writing',
        option_a: 'I love reading; especially mystery novels.',
        option_b: 'The weather was terrible; we decided to stay home.',
        option_c: 'She studied hard; but still failed the test.',
        option_d: 'The cat meowed; because it was hungry.',
        correct_answer: 'B',
        explanation: 'Semicolons connect two independent clauses. Option B has two complete sentences that are closely related. The others incorrectly use semicolons with dependent clauses or conjunctions.',
        hint: 'A semicolon connects two complete sentences that could stand alone.'
      },
      {
        question_text: 'In context, which word should replace "big" to make this sentence more precise?\n\n"The discovery had a big impact on the field of medicine."',
        subject: 'Reading/Writing',
        option_a: 'large',
        option_b: 'profound',
        option_c: 'huge',
        option_d: 'great',
        correct_answer: 'B',
        explanation: '"Profound" is the most precise word to describe a significant intellectual or scientific impact. The other options are too vague or casual.',
        hint: 'Consider which word best describes a deep, important intellectual impact.'
      },
      {
        question_text: 'Which sentence is punctuated correctly?',
        subject: 'Reading/Writing',
        option_a: 'The following items are needed: pencils, paper and erasers.',
        option_b: 'The following items are needed; pencils, paper, and erasers.',
        option_c: 'The following items are needed: pencils, paper, and erasers.',
        option_d: 'The following items are needed, pencils, paper, and erasers.',
        correct_answer: 'C',
        explanation: 'A colon is used before a list when preceded by an independent clause. Commas separate the list items, including the Oxford comma before "and."',
        hint: 'Use a colon to introduce a list after a complete sentence.'
      },
      {
        question_text: 'The primary purpose of this passage is to:\n\nText: "Climate change poses unprecedented challenges to global agriculture. Rising temperatures and shifting precipitation patterns threaten crop yields worldwide. Immediate action is necessary to develop drought-resistant crops and sustainable farming practices."',
        subject: 'Reading/Writing',
        option_a: 'entertain readers with a story',
        option_b: 'persuade readers to take action',
        option_c: 'describe a historical event',
        option_d: 'explain a scientific process',
        correct_answer: 'B',
        explanation: 'The passage presents a problem and calls for "immediate action," which indicates a persuasive purpose.',
        hint: 'Look at the final sentence that calls for action.'
      },
      {
        question_text: 'Which pronoun correctly completes this sentence?\n\n"Each of the participants must bring _____ own supplies."',
        subject: 'Reading/Writing',
        option_a: 'their',
        option_b: 'his or her',
        option_c: 'its',
        option_d: 'our',
        correct_answer: 'B',
        explanation: '"Each" is singular, so it requires a singular pronoun. "His or her" (or the modern accepted "their") agrees with "each." In formal writing, "his or her" is traditionally correct.',
        hint: '"Each" is singular and needs a singular pronoun.'
      },
      {
        question_text: 'Which sentence contains a misplaced modifier?',
        subject: 'Reading/Writing',
        option_a: 'Running quickly, Sarah caught the bus.',
        option_b: 'The dog chased the cat wearing a collar.',
        option_c: 'Tired from studying, Maria went to bed early.',
        option_d: 'The teacher praised the student who worked hard.',
        correct_answer: 'B',
        explanation: 'The modifier "wearing a collar" appears to modify "cat" but likely refers to the dog. It should read: "The dog wearing a collar chased the cat."',
        hint: 'Check which noun each descriptive phrase is actually modifying.'
      },
      {
        question_text: 'What is the author\'s tone in this passage?\n\nText: "The proposed legislation is nothing short of catastrophic. It will devastate small businesses and destroy countless jobs while serving only the interests of wealthy corporations."',
        subject: 'Reading/Writing',
        option_a: 'neutral and objective',
        option_b: 'highly critical and emotional',
        option_c: 'mildly supportive',
        option_d: 'humorous and lighthearted',
        correct_answer: 'B',
        explanation: 'Words like "catastrophic," "devastate," and "destroy" show strong negative emotion and criticism.',
        hint: 'Pay attention to the strong negative language used throughout.'
      },
      {
        question_text: 'Which sentence uses parallel structure correctly?',
        subject: 'Reading/Writing',
        option_a: 'I like hiking, to swim, and biking.',
        option_b: 'I like hiking, swimming, and to bike.',
        option_c: 'I like hiking, swimming, and biking.',
        option_d: 'I like to hike, swimming, and biking.',
        correct_answer: 'C',
        explanation: 'Parallel structure requires items in a list to have the same grammatical form. Option C uses all gerunds (-ing words).',
        hint: 'All items in a list should have the same grammatical structure.'
      },
      {
        question_text: 'Which word is spelled correctly?',
        subject: 'Reading/Writing',
        option_a: 'occassion',
        option_b: 'accomodate',
        option_c: 'necessary',
        option_d: 'seperate',
        correct_answer: 'C',
        explanation: 'The correct spellings are: occasion, accommodate, necessary, and separate.',
        hint: 'Remember: "necessary" has one C and two S\'s.'
      },
      {
        question_text: 'Based on the context, what does "ephemeral" most nearly mean?\n\nText: "The beauty of cherry blossoms is ephemeral; they bloom brilliantly for only a week before falling."',
        subject: 'Reading/Writing',
        option_a: 'eternal',
        option_b: 'short-lived',
        option_c: 'beautiful',
        option_d: 'fragrant',
        correct_answer: 'B',
        explanation: 'The context clue "for only a week" indicates that ephemeral means lasting for a short time.',
        hint: 'Look at the phrase "for only a week" for context.'
      },
      {
        question_text: 'Which revision best improves this wordy sentence?\n\n"Due to the fact that it was raining, the game was postponed."',
        subject: 'Reading/Writing',
        option_a: 'Due to the rain, the game was postponed.',
        option_b: 'Because it was raining, the game was postponed.',
        option_c: 'The game was postponed because of rain.',
        option_d: 'All of the above are improvements.',
        correct_answer: 'D',
        explanation: 'All three options eliminate the wordy phrase "due to the fact that" and express the same idea more concisely.',
        hint: '"Due to the fact that" is a wordy phrase that can almost always be replaced with "because" or "since."'
      },
      {
        question_text: 'Which sentence correctly uses "affect" or "effect"?',
        subject: 'Reading/Writing',
        option_a: 'The weather will effect our plans.',
        option_b: 'The medicine had a positive affect on her health.',
        option_c: 'How did the news affect you?',
        option_d: 'The teacher tried to affect change in the classroom.',
        correct_answer: 'C',
        explanation: '"Affect" is typically a verb meaning to influence. "Effect" is typically a noun meaning result. Option C correctly uses "affect" as a verb.',
        hint: '"Affect" is usually a verb (to influence), while "effect" is usually a noun (a result).'
      },
      {
        question_text: 'What evidence best supports the main claim?\n\nClaim: "Regular exercise improves mental health."',
        subject: 'Reading/Writing',
        option_a: 'Many people enjoy going to the gym.',
        option_b: 'Studies show exercise releases endorphins that reduce stress and anxiety.',
        option_c: 'Exercise can be expensive if you join a gym.',
        option_d: 'Some people prefer outdoor activities to indoor exercise.',
        correct_answer: 'B',
        explanation: 'Option B provides specific scientific evidence linking exercise to mental health benefits through endorphin release.',
        hint: 'Look for specific, factual evidence that directly supports the claim.'
      },
      {
        question_text: 'Which sentence maintains a formal academic tone?',
        subject: 'Reading/Writing',
        option_a: 'Shakespeare\'s plays are totally awesome and everyone should read them.',
        option_b: 'Shakespeare\'s plays contain lots of cool stuff about human nature.',
        option_c: 'Shakespeare\'s plays offer profound insights into human nature and society.',
        option_d: 'You should definitely check out Shakespeare because he\'s the best.',
        correct_answer: 'C',
        explanation: 'Option C uses formal language and avoids casual expressions like "totally awesome," "cool stuff," or "check out."',
        hint: 'Academic writing avoids slang and casual language.'
      },
      {
        question_text: 'Which sentence correctly uses the subjunctive mood?',
        subject: 'Reading/Writing',
        option_a: 'If I was rich, I would travel the world.',
        option_b: 'If I were rich, I would travel the world.',
        option_c: 'If I am rich, I would travel the world.',
        option_d: 'If I been rich, I would travel the world.',
        correct_answer: 'B',
        explanation: 'The subjunctive mood uses "were" instead of "was" for hypothetical or contrary-to-fact situations.',
        hint: 'For hypothetical situations, use "were" even with singular subjects.'
      },
      {
        question_text: 'Which combining sentence strategy is most effective?\n\nSentence 1: The library is closed.\nSentence 2: We need to study elsewhere.',
        subject: 'Reading/Writing',
        option_a: 'The library is closed, and we need to study elsewhere.',
        option_b: 'The library is closed; we need to study elsewhere.',
        option_c: 'Because the library is closed, we need to study elsewhere.',
        option_d: 'All of the above are effective.',
        correct_answer: 'C',
        explanation: 'Option C best shows the cause-and-effect relationship between the two ideas using a subordinating conjunction.',
        hint: 'Consider which option best shows the logical relationship between the two ideas.'
      }
    ];

    console.log('➕ Inserting Math questions...');
    for (const q of mathQuestions) {
      await sql`
        INSERT INTO questions (question_text, subject, option_a, option_b, option_c, option_d, correct_answer, explanation, hint)
        VALUES (
          ${q.question_text},
          ${q.subject},
          ${q.option_a},
          ${q.option_b},
          ${q.option_c},
          ${q.option_d},
          ${q.correct_answer},
          ${q.explanation},
          ${q.hint}
        )
      `;
    }
    console.log(`✅ Added ${mathQuestions.length} Math questions\n`);

    console.log('📖 Inserting Reading/Writing questions...');
    for (const q of readingWritingQuestions) {
      await sql`
        INSERT INTO questions (question_text, subject, option_a, option_b, option_c, option_d, correct_answer, explanation, hint)
        VALUES (
          ${q.question_text},
          ${q.subject},
          ${q.option_a},
          ${q.option_b},
          ${q.option_c},
          ${q.option_d},
          ${q.correct_answer},
          ${q.explanation},
          ${q.hint}
        )
      `;
    }
    console.log(`✅ Added ${readingWritingQuestions.length} Reading/Writing questions\n`);

    const totalQuestions = mathQuestions.length + readingWritingQuestions.length;
    console.log('🎉 Database populated successfully!');
    console.log(`📊 Total questions added: ${totalQuestions}`);
    console.log(`   - Math: ${mathQuestions.length}`);
    console.log(`   - Reading/Writing: ${readingWritingQuestions.length}`);

  } catch (error) {
    console.error('❌ Error populating questions:', error);
    process.exit(1);
  }
}

populateQuestions();