export const SUBJECT_PHRASES: Record<string, { name: string; English?: string[]; Tamil?: string[] }> = {
    // 1. EDUCATIONAL PSYCHOLOGY (Replace with actual UUID)
    "a64abc1a-21d2-483b-ab91-0f545d5f899e": {
        name: "Educational Psychology (English)",
        English: [
            "Try: What is Maslow's theory of motivation?",
            "Try: Explain the concept of IQ",
            "Try: What are the errors in perception?",
            "Try: Define Educational Psychology",
            "Try: Stages of cognitive development"
        ]
    },

    // 1. EDUCATIONAL PSYCHOLOGY - Tamil (Replace with actual UUID)
    "0a6df0c5-f7fc-4bd2-ab06-713fdc88f5e4": {
        name: "Educational Psychology (Tamil)",
        Tamil: [
            "கேட்க முயல்க: மாஸ்லோவின் ஊக்கத்தியர்வின் என்ன?",
            "கேட்க முயல்க: IQ என்றால் என்ன?",
            "கேட்க முயல்க: உணர்வில் ஏற்படும் பிழைகள் என்ன?",
            "கேட்க முயல்க: கல்வி உளவியல் என்றால் என்ன?",
            "கேட்க முயல்க: அறிவியல் வளர்ச்சியின் கட்டங்கள் என்ன?"
        ]
    },

    // 2. CONTEMPORARY INDIA AND EDUCATION - English (Replace with actual UUID)
    "718df50b-e37b-4ab6-8c58-a8de2bf18515": {
        name: "Contemporary India and Education (English)",
        English: [
            "Try: What is the Right to Education Act 2010?",
            "Try: Explain universalization of primary education",
            "Try: Role of education in social diversity",
            "Try: Discuss Gandhi's views on medium of instruction",
            "Try: Causes of inequality in schooling"
        ]
    },
    // 2. CONTEMPORARY INDIA AND EDUCATION - Tamil (Replace with actual UUID)
    "6cb08639-fa92-4b8a-b395-b256d593680f": {
        name: "Contemporary India and Education (Tamil)",
        Tamil: [
            "கேட்க முயல்க: கல்விக்கு உரிமை சட்டம் 2010 என்ன?",
            "கேட்க முயல்க: ஆரம்ப கல்வியின் சர்வதேசப்படுத்தல் என்ன?",
            "கேட்க முயல்க: சமூக பல்வகுப்பில் கல்வியின் பங்கு என்ன?",
            "கேட்க முயல்க: கற்பித்தல் ஊடகத்தில் காந்தியின் கருத்துக்கள் என்ன?",
            "கேட்க முயல்க: பள்ளியில் சமத்துவம் இல்லாததற்கான காரணங்கள் என்ன?"
        ]
    },
};

// Fallback phrases if a subject doesn't have custom ones yet
export const DEFAULT_PHRASES = {
    English: [
        "Ask any concept from your syllabus...",
        "Type a topic to generate exam questions...",
        "What do you want to learn today?"
    ],
    Tamil: [
        "உங்கள் பாடத்திட்டத்திலிருந்து எதையும் கேளுங்கள்...",
        "இன்று நீங்கள் என்ன கற்க விரும்புகிறீர்கள்?",
        "உங்கள் கேள்வியை இங்கே தட்டச்சு செய்யவும்..."
    ]
};