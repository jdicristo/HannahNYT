// ============================================================
//  WORDLE GAME CONFIG
//  Set the target word below. Must be exactly 5 letters.
// ============================================================

export const CONFIG = {
  dictionary_base_url: 'https://api.dictionaryapi.dev/',
  games:[{
    targetWord: 'FARTS',
    modalMessage: 'Ok, but seriously...'
  },
  {
    targetWord: 'POOPS',
    taunt: 'Come on Hannah, not again',
    modalMessage: 'Alright, now for the real one'
  }
,
  {
    targetWord: 'HEATH',
    taunt: 'No Hannah, it\'s not POOPS again',
    modalMessage: 'You did it!'
  }]
};