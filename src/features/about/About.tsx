import Markdown from "react-markdown";


export default function About(): JSX.Element {
  const text = `PapyrusAI was developed by the [Digital Learning Lab](https://www.digitallearninglab.org/) at the University of California, Irvine, in partnership with the Samueli School of Engineering, as part of an NSF grant (#23152984).

  While our initial goal is to develop this tool for use in higher education courses, we received a Proof of Product grant from UCI’s Beall Applied Innovation Center to adapt the tool for secondary school and determine the marketability and feasibility of commercializing PapyrusAI.

  This tool is built on AWS serverless functions and React for the front end. We are using GPT-4 via OpenAI’s API to power our tutor, although we are exploring other language models such as Claude and Llama 2 as alternatives.

  If you want to learn more about what we’re doing or want to get involved, email us at <digitallearninglab@uci.edu>.`
  return (
    <div className="account">
      <div className="account__section-header">
        <h3>About PapyrusAI</h3>

      </div>
      <hr />
      <Markdown className={""}>
        {text}
      </Markdown>
    </div>
  )
}