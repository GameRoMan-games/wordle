const Button = (props: { label: string; onClick: () => void }) => (
  <button
    textContent={props.label}
    class="content-button"
    onClick={props.onClick}
  />
);

export default Button;
