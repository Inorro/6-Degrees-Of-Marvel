import * as React from 'react';
import './Search.css'
import { Autocomplete, TextField} from '@mui/material'

function Search({ handleCallback ,basearr,reset,id}) {
  console.log("Hello")

  const filterOptions2 = (options, { inputValue }) => {
    const recommendList = [];
    const linputValue = inputValue.toLowerCase()
    
    for (let i=0; i<options.length; i++) { // loop till you reach end of big array index
      if (recommendList.length == 4) // if length is 5 this will break the loop
        { 
        break; 
        }
      
      if (
        (`${options[i].disambiguation.toLowerCase()} ${options[i].name.toLowerCase()}`).includes(linputValue)
      ) {
        recommendList.push(options[i]); // add if you find 
        }
    }
  return recommendList
  }

  return (
    <>
      <div>
        <Autocomplete
          className='Autocomplete'// Styling
          options={basearr} // Option Set for searchbox
          getOptionLabel={(options) => `${options.disambiguation ? `(${options.disambiguation}) ${options.name}`: `${options.name}`}`} // Labels shown for search box
          filterOptions={filterOptions2}
          renderOption={(props, options) => {
            return (
              <li
                {...props} key={options.name}>
                {options.disambiguation ? `(${options.disambiguation})`: null}
                {" "}{options.name}
              </li>)
          }}
          onChange={(event, newValue, reason) => {
            if (reason === 'selectOption') {
              handleCallback(event, newValue,id)
            } else if (reason === 'clear') {
              reset(event,id)
            }
          }}
          renderInput={(params) => <TextField {...params} label="Select name" />} // Title above searchbox
        />
      </div>
    </>
  )
}

export default Search
