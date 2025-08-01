export const ContactPage = ({ contact }: { contact: any }) => {
  return (
    <>
      <h1 className="text-center text-5xl my-6">{contact.title}</h1>
      <p className="text-center">
        {contact.description.map((line: string, index: number) => (
          <span key={index}>
            {line} <br />
          </span>
        ))}
        <a className="underline" href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>
    </>
  )
}