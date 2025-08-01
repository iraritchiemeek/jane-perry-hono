const renderDescription = (description: string) => {
  return description.split('\n').map((line, index, arr) => (
    <span key={index}>
      {line}
      {index < arr.length - 1 && <br />}
    </span>
  ));
};

export const AboutPage = ({ about }: { about: any }) => {
  return (
    <div className="px-2 sm:px-8">
      <h1 className="text-center text-5xl my-6">About</h1>
      <div className="text-center">
        {about.description.map((paragraph: string, index: number) => (
          <p key={index}>{paragraph}</p>
        ))}
        <p className="pt-4 underline">
          <a href={about.interview.url} target="_blank" rel="noopener noreferrer">
            {about.interview.text}
          </a>
        </p>
      </div>
      <hr className="my-12" />
      <h1 className="text-center text-5xl mb-6">CV</h1>
      {about.timeline.map((item: any, index: number) => (
        <div key={index} className="pb-4 text-center">
          <p className="font-bold text-sm">{item.year}</p>
          <p className="font-light">{renderDescription(item.description)}</p>
        </div>
      ))}
    </div>
  )
}