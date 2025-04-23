// Attribution: See note at bottom of file

import "../../../index.css";

interface SliderProps {
  title: string;
  styling?: string;
  min: number;
  max: number;
  step: number;
  currentValue: number;
  setCurrentValue: React.Dispatch<React.SetStateAction<number>>;
}

function Slider({
  title,
  styling = "slider",
  min,
  max,
  step,
  currentValue,
  setCurrentValue,
}: SliderProps) {
  return (
    <>
      {title}
      <br />
      {currentValue}
      <br />
      <input
        className={styling}
        type="range"
        min={min.toString()}
        max={max.toString()}
        step={step.toString()}
        value={currentValue.toString()}
        onChange={(event) => {
          setCurrentValue(Number(event.target.value));
        }}
      />
      <br />
    </>
  );
}

export default Slider;

// NOTE: This React control is based on work in the di-controls-react repository by Quantellia (forked by OpenDI).
// See repo here: https://github.com/opendi-org/di-react-controls
// 
// Used under the MIT License. See license here: https://github.com/opendi-org/di-react-controls?tab=MIT-1-ov-file