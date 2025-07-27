# Hockey Data Visualizer
This repository provides an easy-to-use visual interface for coaches or analysts to review and interact with historical hockey data, as provided by [Big Data Cup 2021](https://github.com/bigdatacup/Big-Data-Cup-2021). 

As this project is designed for submission to evaluate programming skill, creative thinking, and ability to design an easy-to-use interface, the README is organized as follows:
* [Exploratory Data Analysis / Ideation](#exploratory-data-analysis--ideation)
* [Methodology](#methodology)
* [Design](#design)
* [Implementation](#implementation)

## Exploratory Data Analysis / Ideation
Before undergoing any coding, the first step is to decide on an interesting, useful, and engaging visualization to pursue. As such, I perform exploratory data analysis (EDA) on the dataset to better understand the characteristics of the data. I first analyze the [Data Dictionary](#data-dictionary), perform EDA on each column to better understand the data, and decide on which data points are necessary to create my desired visualization.

### Data Dictionary
| Column Name           | Data Type | Description                                                                 |
|-----------------------|-----------|-----------------------------------------------------------------------------|
| `game_date`           | Date      | Date of the game in YYYY-MM-DD format (e.g., '2020-12-23').               |
| `Home Team`           | String    | Name of the home team (e.g., 'Toronto Maple Leafs').                      |
| `Away Team`           | String    | Name of the away team (e.g., 'Boston Bruins').                            |
| `Period`              | Integer   | Period number (1-3 for regulation, 4+ for overtime periods).               |
| `Clock`               | String    | Time remaining in the period in MM:SS format (e.g., '19:34').              |
| `Home Team Skaters`   | Integer   | Number of skaters on ice for home team (range: 3-6 players).               |
| `Away Team Skaters`   | Integer   | Number of skaters on ice for away team (range: 3-6 players).               |
| `Home Team Goals`     | Integer   | Goals scored by home team at time of event.                                |
| `Away Team Goals`     | Integer   | Goals scored by away team at time of event.                                |
| `Team`                | String    | Name of team responsible for the event.                                    |
| `Player`              | String    | Name of primary player involved (shooter, passer, etc.).                   |
| `Event`               | String    | Event type: Shot, Goal, Play, Incomplete Play, Takeaway, Puck Recovery, Dump In/Out, Zone Entry, Faceoff Win, Penalty Taken. |
| `X Coordinate`        | Integer   | X-coordinate of event location on ice (0-200), from eventing team's perspective. |
| `Y Coordinate`        | Integer   | Y-coordinate of event location on ice (0-85), from eventing team's perspective. |
| `Detail 1`            | String    | Primary event detail: Shot type (Deflection, Fan, Slapshot, Snapshot, Wrap Around, Wristshot), Pass type (Direct, Indirect), Entry type (Carried, Dumped, Played), Possession outcome (Retained, Lost), or Penalty type. |
| `Detail 2`            | String    | Secondary detail: Shot destination (On Net, Missed, Blocked) for shots/goals. |
| `Detail 3`            | String    | Tertiary detail: Traffic indicator (true/false) for shots/goals.           |
| `Detail 4`            | String    | Additional detail: One timer indicator (true/false) for shots/goals.       |
| `Player 2`            | String    | Secondary player: Pass target, faceoff opponent, penalty drawer, targeted defender. |
| `X Coordinate 2`      | Integer   | Secondary X-coordinate: Pass target location, varies by event type.        |
| `Y Coordinate 2`      | Integer   | Secondary Y-coordinate: Pass target location, varies by event type.        |

In addition to `olympic_womens_dataset.csv`, there is tracking data provided in the GitHub repository; however, the data provided in `TrackingData` is for a different dataset.

### Insights
Considering the coordinate-based nature of this dataset, have a clean visual of the rink would make for useful analysis. Additionally, as we are working with many events over time, some sort of timeline visualization as well as heatmap could be useful ways to visualze the information.

It's interesting to note that Passes (Play/Incomplete Play) are the only events which ave two sets of coordinates, which we can use to draw a line between players. However, we do not have a full dataset of player locations during these games, which would be interesting to consider for further analytics.

For shots on goal, we have addtional detailed information (Traffic, One-Timer) that could be used for additional analysis.

## Methodology

## Design
### Frontend Design
#### UX/UI
Navigating data-heavy visualizations can be challenging, and as such, clean and simple designs that abstract away as much decision making as possible lead to better user experiences.

For theming, we consider the [Calgary Flames team colors](https://teamcolorcodes.com/calgary-flames-color-codes/) for consistency with the team and likely other applications in use by the team.
* Red #D2001C
* Yellow #FAAF19
* White #FFFFFF
* Black #111111

I've used a number of component libraries but recently gravitate towards Shad.cn for its customizabiltity.

The general design of the dashboard to contain settings/options on the left-hand sidebar, with the main section of the page reserved for visualizations and analytics. The webpage is split up between two types of useful visualizations: (1) Rink Visualizations and (2) Table Visualizations. Rink allows for an interactive visual analysis of games whereas Table visualizations summarizes player statistics and performance on a clean interface.

#### Technical Stack
Considering we are aiming to make an interesting, engaging, and useful data visualization, there are many options available. Python can provide great functionality out of the box with plotting libraries such as `matplotlib`, `plotly` and many others. I considered using `streamlit` as a way to provide an all-inclusive framework for easy development and deployment. 

`Streamlit` would be a great framework considering its `Python`-based we have our incoming dataset ready. `Streamlit` is limited in that it cannot be deployed with any backend, as the framework itself is tightly coupled and not extensible. For simple charts, graphs, tables, and experimenting with classical machine learning methods, Streamlit is a great pick.

However, as we are working with X, Y data, and want to create an engaging visual presentation, I will choose `React` as a more extensible, customizable frontend framework for development as there are many more charting/graphing libraries available in Javascript.



### Backend Design

#### Database Design
Considering we would like to design for an extensible application, with the ability to add future game data if desired, I have opted to include a database and client/server architecture. As we will have very limited writes, and a low-traffic of read operations, `SQLite` will be more than sufficient for our purposes.

## Implementation
### Technical Stack

### Deployment
#### Local Deployment

#### Cloud Deployment


python -m data_analysis.eda
python -m data_analysis.split_games