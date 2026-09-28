// Release notes shown to research centre staff after the app updates.
//
// Add a new entry at the top whenever the version in package.json is bumped.
// Keep this list cumulative: someone jumping several releases sees every entry
// between their old version and the new one, so never delete old entries.
//
// Notes are bundled with the app rather than fetched, which guarantees a user
// can never see notes that disagree with the code they are running.
export const CHANGELOG = [
  {
    version: '2.2.3',
    date: '2026-09-28',
    notes: [
      'Settings now has a "Check for updates" button that tells you when a new version is ready to install.',
      'The update reminder no longer disappears for the rest of the session after you dismiss it.',
      'You now see release notes like these each time the app updates.',
      'If an update ever gets stuck, Settings has a "Clear cache & reload" option.',
    ],
  },
  {
    version: '2.2.2',
    date: '2026-09-25',
    notes: [
      'You can now search the list of recent supervisor changes to find the one you are looking for.',
      'Registration numbers no longer keep stray spaces when they are copied in or pasted.',
      'Full names entered as all lower case are now capitalised automatically.',
    ],
  },
  {
    version: '2.2.1',
    date: '2026-09-17',
    notes: [
      'Routine maintenance release. No functional changes.',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-09-16',
    notes: [
      'A supervisor change now has to declare what type of change it is, and it is checked for correctness before it goes through.',
      'Study mode now covers evening and weekend schedules, not just weekdays.',
    ],
  },
];
