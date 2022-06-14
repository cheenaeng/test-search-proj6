import './App.css';
import React, { useState } from 'react';
import { matchSorter } from 'match-sorter';
import nlp from 'compromise';
import ingredientsList from './testRegex.js';

function App() {
  const [input, setInput] = useState('');
  const [display, showDisplay] = useState([]);
  const ingredientsListSplit = ingredientsList.map((item) => ({ keyWords: item.split(' '), itemName: item }));

  const processInput = (inputTerms) => {
    const doc = nlp(inputTerms);
    // doc.adjectives().remove()
    // doc.verbs().remove()
    doc.possessives().strip();
    doc.prepositions().remove();
    doc.pronouns().remove();
    doc.adjectives().remove();
    // doc.places().remove()
    // const removedArticles = doc.not('the').not('a').not('an')
    console.log(doc.nouns().text());
    return doc.nouns().text();
  };

  // logic basis - to get an exact match first, if fails then do the rest
  // logic - if there is an exact match, set exact match first

  // if no exact match, check the processed input against each keyword in the list of ingredient list

  // if really no exact match, then check each processed input (split by space) against each keyword in the ingredient list

  const handleInput = (e) => {
    showDisplay([]);
    const inputValue = e.target.value;
    setInput(inputValue);
    // remove all adjectives, possessives(apos), prepositions,places, articles
    const processedInput = processInput(inputValue);
    const splitInput = processedInput.split(' ');
    console.log(processedInput.length);
    if (processedInput.length !== 0) {
      const checkExactMatch = matchSorter(ingredientsListSplit, processedInput, { keys: ['itemName'] });
      console.log(checkExactMatch);
      if (checkExactMatch.length > 0) {
        console.log('exact match');
        showDisplay(checkExactMatch.flat());
      } else {
        const checkKeyWordsMatch = matchSorter(ingredientsListSplit, processedInput, { keys: ['keyWords'] });

        if (checkKeyWordsMatch.length > 0) {
          showDisplay(checkKeyWordsMatch.flat());
        } else {
          const matchedWords = splitInput.map((word) => matchSorter(ingredientsListSplit, word, { keys: ['keyWords'] }));
          showDisplay(matchedWords.flat());
        }
      }
    }
  };
  return (
    <div className="App">
      <h1>Testing</h1>
      <p> search</p>
      <input type="text" onChange={handleInput} value={input} />
      <button type="button">Submit</button>
      <div>
        {display.splice(0, 3).map((ingredient) => <p>{ingredient.itemName}</p>)}
      </div>
    </div>
  );
}

export default App;
