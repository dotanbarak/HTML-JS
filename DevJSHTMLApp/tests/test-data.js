const testSRTContent = `1
00:00:01,000 --> 00:00:03,000
Speaker 1: משהו מאוד עמוק, מוערך.

2
00:00:03,000 --> 00:00:30,000
Speaker 2: ומשמעותי בשבילי. ויצאתי ממנה בהרגשה, אחרי זה סיפרתי לענת.

3
00:00:30,000 --> 00:00:32,000
Speaker 3: ו... זה...

4
00:00:32,000 --> 00:00:49,000
Speaker 2: מהמקומות שבה היא רואה אותי כאילו... ב-overdoing.

5
00:00:49,000 --> 00:00:51,000
Speaker 3: ש...`;

const testSRTContentModified = `1
00:00:01,000 --> 00:00:03,000
John: Something very deep and meaningful.

2
00:00:03,000 --> 00:00:30,000
Sarah: And meaningful to me. I left with a feeling, then I told Anat.

3
00:00:30,000 --> 00:00:32,000
Mike: And... this...

4
00:00:32,000 --> 00:00:49,000
Sarah: From the places where she sees me as... overdoing it.

5
00:00:49,000 --> 00:00:51,000
Mike: Sh...`;

const invalidSRTContent = `This is not
a valid SRT file
without proper formatting`;

const testInstructions = {
    speakerChanges: [
        { from: 'Speaker 1', to: 'John' },
        { from: 'Speaker 2', to: 'Sarah' },
        { from: 'Speaker 3', to: 'Mike' }
    ],
    textEdits: [
        { id: 1, newText: 'Something very deep and meaningful.' },
        { id: 2, newText: 'And meaningful to me. I left with a feeling, then I told Anat.' },
        { id: 4, newText: 'From the places where she sees me as... overdoing it.' }
    ],
    expectedResults: {
        totalEntries: 5,
        uniqueSpeakers: 3,
        modifiedEntries: 4
    }
};

window.TestData = {
    testSRTContent,
    testSRTContentModified,
    invalidSRTContent,
    testInstructions
};