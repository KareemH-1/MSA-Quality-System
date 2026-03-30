import React from 'react'
import "./styles/Overview.css"
import {VisualCard} from "../VisualCard";
const Overview = () => {
  return (
    <div id="overview">

      <div className="content">
        
        <div className="row first-row">
            <VisualCard className="card"
            title="this is a test card"
            description="more are to be added to this page soon, this is just a placeholder to show how the page will look like once we have data to display"
            category="appeals"
            /> 
        </div>
        
      </div>
    </div>
  )
}

export default Overview
