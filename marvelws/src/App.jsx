import { useEffect, useState } from 'react'
import styles from './App.module.css';
import Search from './components/Search'
import axios from "axios";
const port = import.meta.env.VITE_PORT;

function App() {
  const [nameList, setNames] = useState([]);
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [img1, setIMG1] = useState("");
  const [img2, setIMG2] = useState("");
  const [data, setData] = useState([]);
  const [datasearched, setDatasearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const baseurl = "https://marvel.fandom.com"
  // These lines of code initialize an empty variable and a function to define that variable later

  const fetchAPI = async () => { //Using axios func makes api call to backend and fetches data
    const response = await axios.get(`${port}/api`);
    setNames(response.data)
  }

  useEffect(() => { //Calls previous function on app startup
    fetchAPI();
  }, []);

  useEffect(() => {
    if (url1) {
      fetchChar1()
    };
    if (url2) {
      fetchChar2()
    } else {
      return;
    };
  }, [url1, url2]);


  const [name1, setName1] = useState(null);
  const [name2, setName2] = useState(null);

  const handleCallback = (event, index, id) => {
    //console.log(index)
    if (id == 1) {
      setName1(index.name);
      setUrl1(index.url);
      setDatasearched(false);
    } else if (id == 2) {
      setName2(index.name);
      setUrl2(index.url);
      setDatasearched(false);
    }
  }

  const reset = (event, id) => {
    if (id == 1) {
      setDatasearched(false)
      setIMG1("")
      setUrl1("")
      setName1("")
    } else if (id == 2) {
      setDatasearched(false)
      setName2("")
      setIMG2("")
      setUrl2("");
    }
  }

  const fetchChar1 = async () => {
    const result = await axios.get(`${port}/img`, { params: { nurl: baseurl + url1 } });
    if (result.data) {
      setIMG1(result.data);
    } else {
      setIMG1("broken image");
    }
    //console.log(result)
  };

  const fetchChar2 = async () => {
    const result = await axios.get(`${port}/img`, { params: { nurl: baseurl + url2 } });
    if (result.data) {
      setIMG2(result.data);
    } else {
      setIMG2("broken image");
    }
    //console.log(result)
  };

  const commonAppearance = async () => {
    setData([]);
    if (url1 && url2) {
      setLoading(true)
      const result = await axios.get(`${port}/scrape`, { params: { url1: baseurl + url1, url2: baseurl + url2, name1: name1, name2: name2 } });
      setLoading(false)
      setData(result.data);
      setDatasearched(true)
      //console.log(result)
    }
  }

  const OtherImgs = async (otherUrl) => {
    let otherImg = await axios.get(`${port}/img`, { params: { nurl: otherUrl } });
    return otherImg
  }

  function Connections() {
    if (data[0] === "Fifth-Degree") {
      const [notableImgA, setNotableImgA] = useState("");
      const [notableImgB, setNotableImgB] = useState("");
      const [notableImgC, setNotableImgC] = useState("");
      const [notableImgD, setNotableImgD] = useState("");
      OtherImgs(data[3]).then(ret => setNotableImgA(ret.data));
      OtherImgs(data[1]).then(ret => setNotableImgB(ret.data));
      OtherImgs(data[2]).then(ret => setNotableImgC(ret.data));
      OtherImgs(data[4]).then(ret => setNotableImgD(ret.data));
      return <>
        <ul style={{ width: "150px" }}> {(data[8].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "11px" }} target="_blank" >{item}</a>
          </li>
        }))} </ul>

        <div>
          <img src={notableImgA} referrerPolicy="no-referrer" /><figcaption>{data[12]}</figcaption>
        </div>

        <ul style={{ width: "120px" }}>{(data[5].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "11px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>

        <div>
          <img src={notableImgB} referrerPolicy="no-referrer" /><figcaption>{data[10]}</figcaption>
        </div>

        <ul style={{ width: "120px" }}>{(data[6].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "11px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>

        <div>
          <img src={notableImgC} referrerPolicy="no-referrer" /><figcaption>{data[11]}</figcaption>
        </div>

        <ul style={{ width: "120px" }}>{(data[7].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "11px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>

        <div>
          <img src={notableImgD} referrerPolicy="no-referrer" /><figcaption>{data[13]}</figcaption>
        </div>
        <ul style={{ width: "120px" }}>{(data[9].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "11px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>
      </>

    } else if (data[0] === "Fourth-Degree") {
      const [notableImgA, setNotableImgA] = useState("");
      const [notableImgB, setNotableImgB] = useState("");
      const [notableImgC, setNotableImgC] = useState("");
      OtherImgs(data[1]).then(ret => setNotableImgA(ret.data));
      OtherImgs(data[2]).then(ret => setNotableImgB(ret.data));
      OtherImgs(data[3]).then(ret => setNotableImgC(ret.data));
      return <>
        <ul style={{ width: "150px" }}> {(data[4].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "13px" }} target="_blank" >{item}</a>
          </li>
        }))} </ul>
        <div>
          <img src={notableImgA} referrerPolicy="no-referrer" /><figcaption>{data[8]}</figcaption>
        </div>
        <ul style={{ width: "120px" }}>{(data[5].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "12px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>
        <div>
          <img src={notableImgC} referrerPolicy="no-referrer" /><figcaption>{data[10]}</figcaption>
        </div>
        <ul style={{ width: "150px" }}>{(data[6].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "13px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>
        <div>
          <img src={notableImgB} referrerPolicy="no-referrer" /><figcaption>{data[9]}</figcaption>
        </div>
        <ul style={{ width: "150px" }}>{(data[7].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "13px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>
      </>


    } else if (data[0] === "Third-Degree") {
      const [notableImgA, setNotableImgA] = useState("");
      const [notableImgB, setNotableImgB] = useState("");
      OtherImgs(data[1]).then(ret => setNotableImgA(ret.data));
      OtherImgs(data[2]).then(ret => setNotableImgB(ret.data));
      return <>
        <ul style={{ width: "150px" }}> {(data[3].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "13px" }} target="_blank" >{item}</a>
          </li>
        }))} </ul>

        <div>
          <img src={notableImgA} referrerPolicy="no-referrer" /><figcaption>{data[6]}</figcaption>
        </div>

        <ul style={{ width: "120px" }}>{(data[4].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "12px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>

        <div>
          <img src={notableImgB} referrerPolicy="no-referrer" /><figcaption>{data[7]}</figcaption>
        </div>

        <ul style={{ width: "150px" }}>{(data[5].slice(0, 5).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} style={{ fontSize: "13px" }} target="_blank" >{item}</a>
          </li>
        }))}</ul>
      </>


    } else if (data[0] === "Second-Degree") {
      const [notableImg, setNotableImg] = useState("");
      OtherImgs(data[1]).then(ret => setNotableImg(ret.data));

      return <>
        <ul> {(data[2].slice(0, 8).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} target="_blank">{item}</a>
          </li>
        }))} </ul>

        <div>
          <img src={notableImg} referrerPolicy="no-referrer" /><figcaption>{data[4]}</figcaption>
        </div>

        <ul>{(data[3].slice(0, 8).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} target="_blank">{item}</a>
          </li>
        }))}</ul>
      </>


    } else {
      return <ul>
        {data == "No Appearances" ? (
          <li><span>No Appearances</span></li> // Render this if the array is empty
        ) : (data.slice(0, 8).map(function (item, i) {
          return <li key={i}>
            <a href={baseurl + "/wiki/" + item.replace(/ /g, "_")} target="_blank">{item}</a>
          </li>
        })
        )}
      </ul>;
    }
  }

  return (
    <div className={styles.main}>
      <h1>Six Degrees of Marvel</h1>
      <div className={styles.searchbars}>
        <Search
          handleCallback={handleCallback}
          basearr={nameList}
          reset={reset}
          id={1}
        />

        <Search
          handleCallback={handleCallback}
          basearr={nameList}
          reset={reset}
          id={2}
        />

      </div>
      <div className={styles.imgs} style={name1 || name2 ? { display: 'flex' } : { display: 'none' }}>
        <div>
          <img src={img1}
            style={img1 ? null : { visibility: 'hidden' }}
            referrerPolicy="no-referrer"
          />
          <figcaption>{name1}</figcaption>
        </div>

        {datasearched ? <Connections className={styles.multipleDeg} /> : <ul></ul>}

        <div>
          <img src={img2}
            style={img2 ? null : { visibility: 'hidden' }}
            referrerPolicy="no-referrer"
          />
          <figcaption>{name2}</figcaption>
        </div>
      </div>
      <button 
        onClick={commonAppearance}
        className={styles.button}
        disabled={!(url1 && url2)}
      >
        Find Shared Appearances
      </button>
      <div className={styles.loading} style={loading ? { display: 'flex' } : { display: 'none' }}>
        <div className={styles.sk_chase}>
          <div className={styles.sk_chase_dot}></div>
          <div className={styles.sk_chase_dot}></div>
          <div className={styles.sk_chase_dot}></div>
          <div className={styles.sk_chase_dot}></div>
          <div className={styles.sk_chase_dot}></div>
          <div className={styles.sk_chase_dot}></div>
        </div></div>
    </div>
  )
}

export default App
