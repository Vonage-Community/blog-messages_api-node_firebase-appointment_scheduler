// Datepicker initialization
const d = new Datepicker(document.getElementById("date-input"), {
  last_date: new Date(2021, 06, 21),
  enabled_days: (d) => {
    return d.getDay() > 0 && d.getDay() < 6;
  },
  format: (d) => {
    return MONTHS_SHORT[d.getMonth()] + " " + d.getDate();
  },
});