const gradients = [
  "linear-gradient(135deg,#9CC7A5,#5F9A72)",
  "linear-gradient(135deg,#E8B77E,#D89A55)",
  "linear-gradient(135deg,#A9CBB4,#7CAE86)",
  "linear-gradient(135deg,#8FB6A0,#5F9A72)",
  "linear-gradient(135deg,#EBC08A,#D89A55)",
  "linear-gradient(135deg,#B7D3BE,#7CAE86)",
];

export function gradient(i: number): string {
  return gradients[i % gradients.length];
}

export function euro(n: number): string {
  return "€ " + n.toLocaleString("nl-NL");
}
