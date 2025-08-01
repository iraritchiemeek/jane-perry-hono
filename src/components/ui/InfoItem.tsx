export const InfoItem = ({ title, value }: { title: string, value: string }) => (
  <div className="pb-4">
    <p className="font-bold text-sm">{title}:</p>
    <p className="font-light text-xl" style={{whiteSpace: 'pre-line'}}>{value}</p>
  </div>
)