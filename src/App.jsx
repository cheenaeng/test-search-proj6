import './App.css';
import React, { useState, useEffect } from 'react';
import { matchSorter } from 'match-sorter';
import nlp from 'compromise';
import datePlugin from 'compromise-dates';
import fuzzysearch from 'fuzzysearch';
import { distance } from 'fastest-levenshtein';
import ingredientsList from './testRegex.js';
import ocrResponse from './testOCR.js';

nlp.plugin(datePlugin);

function App() {
  const [input, setInput] = useState('');
  const [display, showDisplay] = useState([]);
  const ingredientsListSplit = ingredientsList.map((item) => ({ keyWords: item.split(' '), itemName: item }));
  const [ocrTest, setOcrTest] = useState([]);

  console.log(ocrTest);

  const processInput = (inputTerms) => {
    const originalTerm = inputTerms;
    const doc = nlp(inputTerms);
    const regex = /(?:\d.\d{1,3}\s?(x|X)\s?\d.\d{1,3})/g;
    const receiptKeyWords = ['change', 'cash', 'gst', 'tax', 'invoice', 'fairprice', 'purchased', 'rounding'];
    if (inputTerms.includes('#')
    || inputTerms.match(regex) !== null
    || doc.dates().get().length !== 0
    || receiptKeyWords.some((word) => inputTerms.includes(word))) {
      return '';
    }
    doc.possessives().strip();
    doc.prepositions().remove();
    doc.pronouns().remove();
    doc.numbers().remove();
    doc.places().remove();
    doc.urls().remove();
    doc.match('roast').remove();

    const removedArticles = doc.not('the').not('a').not('an');
    return { original: originalTerm, processed: removedArticles.nouns().text() };
  };

  const matchChecker = (detectedInput, originalName) => {
    const splitInput = detectedInput.split(' ');

    if (detectedInput.length !== 0) {
      // confirmed matches
      const checkExactMatch = matchSorter(ingredientsListSplit, detectedInput, { keys: ['itemName'] });
      if (checkExactMatch.length > 0) {
        setOcrTest((prev) => ([...prev, { parsedName: originalName, word: detectedInput, match: checkExactMatch.flat() }]));
      } else {
        // unsure matches
        const likelyMatches = [];
        ingredientsListSplit.forEach((ingredient) => {
          ingredient.keyWords.forEach((word) => {
            if (fuzzysearch(detectedInput, word) || fuzzysearch(word, detectedInput)) {
              console.log(detectedInput);
              const similarityValue = distance(detectedInput, ingredient.itemName);
              console.log(similarityValue, word);
              likelyMatches.push({ ...ingredient, value: similarityValue });
              const found = likelyMatches.some((match) => match.itemName === ingredient.itemName);
              if (!found) likelyMatches.push({ ...ingredient, value: similarityValue });
            }
          });
        });
        likelyMatches.sort((a, b) => a.value - b.value);

        if (likelyMatches.length > 0) {
          setOcrTest((prev) => ([...prev, { parsedName: originalName, word: detectedInput, match: likelyMatches }]));
        } else {
          // unsure matches
          const possibleMatches = [];
          for (let i = 0; i < ingredientsListSplit.length; i += 1) {
            ingredientsListSplit[i].keyWords.forEach((word) => {
              splitInput.forEach((inputWord) => {
                if (fuzzysearch(inputWord, word)) {
                  const currentIngredient = ingredientsListSplit[i];
                  const similarityValue = distance(detectedInput, ingredientsListSplit[i].itemName);
                  const found = possibleMatches.some((match) => match.itemName === currentIngredient.itemName);
                  if (!found) possibleMatches.push({ ...currentIngredient, value: similarityValue });
                } });
            });
          }
          possibleMatches.sort((a, b) => a.value - b.value);
          // ingredientsListSplit.forEach((ingredient) => {
          //   console.log(closest(detectedInput, ingredient.itemName));
          // });
          setOcrTest((prev) => ([...prev, { parsedName: originalName, word: detectedInput, match: possibleMatches }]));
        }
      }
    }
  };

  useEffect(() => {
    const ocr = ocrResponse[0].description.split('\n');
    console.log(ocr);
    ocr.forEach((lineItem) => {
      const { original, processed } = processInput(lineItem.toLowerCase());
      console.log(processed);
      if (processed !== undefined) {
        matchChecker(processed, original);
      }
    });
  }, []);

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
          // check each keyword in the input and match each keyword of input with the keyword of each ingredient --> if true --> return the itenName

          const possibleMatches = [];
          for (let i = 0; i < ingredientsListSplit.length; i += 1) {
            console.log(ingredientsListSplit[i]);
            ingredientsListSplit[i].keyWords.forEach((word) => {
              splitInput.forEach((inputWord) => {
                console.log(inputWord);
                if (fuzzysearch(inputWord, word)) {
                  possibleMatches.push(ingredientsListSplit[i]);
                }
              });
            });
          }
          console.log(possibleMatches);
          showDisplay(possibleMatches);
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
        {ocrTest.map((x) => x.match.splice(0, 1).map((ingredient) => (
          <p>
            {x.parsedName}
            {' '}
            {'>>>'}
            {' '}
            {ingredient.itemName}
          </p>
        )))}

      </div>
    </div>
  );
}

export default App;
