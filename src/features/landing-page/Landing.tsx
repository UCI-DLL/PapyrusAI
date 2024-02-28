import { Button } from "@mui/material";
import Markdown from "react-markdown";
import { useNavigate } from "react-router";



export default function Landing(): JSX.Element {
  let navigator = useNavigate();
  const text = `PapyrusAI is a generative AI-based tool to help build students' writing skills and AI literacy while protecting student privacy and teacher agency.

  PapyrusAI functions like a Socratic teacher, helping students develop their topic, outline, or argument through back-and-forth dialogue, and providing feedback on their organization, content, and language use. Through using it, students get first-hand practice working with AI in a safe and scaffolded environment.

  PapyrusAI is a project of the [Digital Learning Lab](https://www.digitallearninglab.org/) at the University of California, Irvine. Our funders include the National Science Foundation (Grant [#23152984](https://www.digitallearninglab.org/gen-ai-in-eng-writing.html)) and UCI Beall Apllied Innovation ([Proof of Product](https://innovation.uci.edu/pop-grants/awardees/) grant).`

  return (
    <div className="landing">
      <header className="landing__section-header">
        <a href={"/"} className="landing__section-header__logo" aria-label="PapyrusAI Logo" >
          <span className="for-screen-readers-only">PapyrusAI</span>
          <span className="landing__section-header__logo-dimensions">
            <img src="/dll-logo-noname.png" alt="PapyrusAI logo" />
            <h6 className="landing__section-header__logo-title">PapyrusAI</h6>
          </span>
        </a>
      </header>
      <div className="landing__content">
        <div className="landing__column">
          <h3 style={{marginBottom: "1.5rem"}}>Grow your students' writing skills and AI literacy</h3>
          <Markdown className={""}>
            {text}
          </Markdown>
        </div>
        <div className="landing__column" style={{ alignContent: "center", justifyContent: "center", alignItems: "center" }}>

          <h4 style={{ textAlign: "center" }}>Already enrolled as an instructor or student?</h4>
          <Button
            onClick={() => navigator("/login")}
            variant="contained"
            size="large"
            style={{ padding: "1rem", marginTop: "1rem", marginBottom: "1rem", width: "100%" }}
          >
            Login Here
          </Button>
          &nbsp;&nbsp;&nbsp;
          <h6>To stay up-to-date with new studies and scaling PapyrusAI into more schools, please fill out the following form:</h6>
          <Button
            onClick={() => window.open("https://forms.gle/XEsPMDKM6vwNP4TW7", "_blank")}
            variant="contained"
            size="large"
            style={{ padding: "1rem", marginTop: "1rem", width: "100%" }}
          >
            Stay Informed
          </Button>

        </div>

      </div>

    </div>
  )
}