// Define your UUIDs as constants so you don't make typos
export const PROGRAMS = {
    BED: '6bf348ad-a999-4dbc-b006-643e0ac863b8',
};

export const DEPARTMENTS = {
    GENERAL: '33f8e401-5bdb-4e4f-835a-876aac8a6a60',
    CS: '2a29b998-81d6-458d-9a7d-dc1b2d1fa2d4',
    ENGLISH: 'your-english-dept-uuid-here',
};

export const SUBJECT_METADATA = [
    // --- SEMESTER 1: CORE SUBJECTS (GENERAL) ---
    {
        id: 'a64abc1a-21d2-483b-ab91-0f545d5f899e',
        name: 'Educational Psychology',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.GENERAL,
        semester: 1,
        medium: 'English'
    },
    {
        id: '0a6df0c5-f7fc-4bd2-ab06-713fdc88f5e4',
        name: 'Educational Psychology',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.GENERAL,
        semester: 1,
        medium: 'Tamil'
    },

    {
        id: '718df50b-e37b-4ab6-8c58-a8de2bf18515',
        name: 'Contemporary India and Education',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.GENERAL,
        semester: 1,
        medium: 'English'
    },
    {
        id: '6cb08639-fa92-4b8a-b395-b256d593680f',
        name: 'Contemporary India and Education',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.GENERAL,
        semester: 1,
        medium: 'Tamil'
    },

    {
        id: '6ae6964c-9b2b-4bd2-aecf-a4b1f084a435',
        name: 'Teaching and Learning',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.GENERAL,
        semester: 1,
        medium: 'English'
    },
    {
        id: '917798e5-4a86-42b6-bf5e-1a3db88ce809',
        name: 'Teaching and Learning',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.GENERAL,
        semester: 1,
        medium: 'Tamil'
    },
    {
        id: '27ccfc90-69c5-4737-b9a4-28ba3eeb54d4',
        name: 'Language Across the Curriculum',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.GENERAL,
        semester: 1,
        medium: 'Tamil'
    },
    {
        id: 'd1c8e5b7-9a3e-4c8f-9a2b-5f1e2c3d4e5f',
        name: 'Language Across the Curriculum',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.GENERAL,
        semester: 1,
        medium: 'English'
    },

    // --- SEMESTER 1: PEDAGOGY SUBJECTS (SPECIFIC DEPARTMENTS) ---
    {
        id: '467d083a-9a9b-4f99-a12b-b162108ef42a',
        name: 'Pedagogy of Computer Science',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.CS,
        semester: 1,
        medium: 'English'
    },
    {
        id: 'e9615401-4135-4d2d-8178-9d9070ae932b',
        name: 'Pedagogy of Computer Science',
        programId: PROGRAMS.BED,
        departmentId: DEPARTMENTS.CS,
        semester: 1,
        medium: 'Tamil'
    },
];