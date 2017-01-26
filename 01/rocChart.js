function rocChart(id, data, options) {
  // set default configuration
  const cfg = {
    'margin': {top: 30, right: 20, bottom: 70, left: 61},
    'width': 470,
    'height': 450,
    'interpolationMode': 'basis',
    'ticks': undefined,
    'tickValues': [0, .1, .25, .5, .75, .9, 1],
    'fpr': 'fpr',
    'tprVariables': [{
      'name': 'tpr0',
    }], 
    'animate': true
  };

  //Put all of the options into a variable called cfg
  if('undefined' !== typeof options){
    Object.keys(options).forEach(key => {
      if('undefined' !== typeof options[key]){ cfg[key] = options[key]; }
    })
  }

  const tprVariables = cfg['tprVariables'];
  // if values for labels are not specified
  // set the default values for the labels to the corresponding
  // true positive rate variable name
  tprVariables.forEach((d, i) => {
    if('undefined' === typeof d.label){
      d.label = d.name;
    }

  })

  console.log('tprVariables', tprVariables);


  const interpolationMode = cfg['interpolationMode'];
  const fpr = cfg['fpr'];
  const width = cfg['width'];
  const height = cfg['height'];
  const animate = cfg['animate'];

  const format = d3.format('.2');
  const aucFormat = d3.format('.4r');

  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);
  const color = d3.scaleOrdinal()
    .range(d3.schemeCategory10); // d3.scaleOrdinal().range(['steelblue', 'red', 'green', 'purple']);

  const xAxis = d3.axisTop()
    .scale(x)
    .tickSizeOuter(0);

  const yAxis = d3.axisRight()
    .scale(y)
    .tickSizeOuter(0);

  // set the axis ticks based on input parameters,
  // if ticks or tickValues are specified
  if('undefined' !== typeof cfg['ticks']) {
    xAxis.ticks(cfg['ticks']);
    yAxis.ticks(cfg['ticks']);
  } else if ('undefined' !== typeof cfg['tickValues']) {
    xAxis.tickValues(cfg['tickValues']);
    yAxis.tickValues(cfg['tickValues']);
  } else {
    xAxis.ticks(5);
    yAxis.ticks(5);
  }

  // apply the format to the ticks we chose
  xAxis.tickFormat(format);
  yAxis.tickFormat(format);

  // a function that returns a line generator
  function curve(data, tpr) {

     const lineGenerator = d3.line()
      .curve(d3.curveBasis)
      .x(d => x(d[fpr]))
      .y(d => y(d[tpr]));

    return lineGenerator(data);
  }

  // a function that returns an area generator
  function areaUnderCurve(data, tpr) {

    const areaGenerator = d3.area()
      .x(d => x(d[fpr]))
      .y0(height)
      .y1(d => y(d[tpr]));

    return areaGenerator(data);
  }

  const svg = d3.select('#roc')
    .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

  x.domain([0, 1]);
  y.domain([0, 1]);

  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .append('text')            
        .attr('x', width / 2)
        .attr('y', 40 )
        .style('text-anchor', 'middle')
        .text('False Positive Rate')

  const xAxisG = svg.select('g.x.axis');

  // draw the top boundary line
  xAxisG.append('line')
    .attr({
      'x1': -1,
      'x2': width + 1,
      'y1': -height,
      'y2': -height
    });

  // draw a bottom boundary line over the existing
  // x-axis domain path to make even corners
  xAxisG.append('line')
    .attr({
      'x1': -1,
      'x2': width + 1,
      'y1': 0,
      'y2': 0
    });


  // position the axis tick labels below the x-axis
  xAxisG.selectAll('.tick text')
    .attr('transform', `translate(0,${25})`);

  // hide the y-axis ticks for 0 and 1
  xAxisG.selectAll('g.tick line')
    .style('opacity', d => // if d is an integer
  (d % 1 === 0 ? 0 : 1));

  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')            
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      // manually configured so that the label is centered vertically 
      .attr('x', 0 - height/1.56)  
      .style('font-size','12px')              
      .style('text-anchor', 'left')
      .text('True Positive Rate');

  yAxisG = svg.select('g.y.axis');

  // add the right boundary line
  yAxisG.append('line')
    .attr({
      'x1': width,
      'x2': width,
      'y1': 0,
      'y2': height
    })

  // position the axis tick labels to the right of 
  // the y-axis and
  // translate the first and the last tick labels
  // so that they are right aligned
  // or even with the 2nd digit of the decimal number
  // tick labels
  yAxisG.selectAll('g.tick text')
    .attr('transform', d => {
      if(d % 1 === 0) { // if d is an integer
        return `translate(${-22},0)`;
      } else if((d*10) % 1 === 0) { // if d is a 1 place decimal
        return `translate(${-32},0)`;
      } else {
        return `translate(${-42},0)`;
      }
  })

  // hide the y-axis ticks for 0 and 1
  yAxisG.selectAll('g.tick line')
    .style('opacity', d => // if d is an integer
  (d % 1 === 0 ? 0 : 1));

  // draw the random guess line
  svg.append('line') 
    .attr('class', 'curve')         
    .style('stroke', 'black')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', height)
    .attr('y2', 0)
    .style('stroke-width', 2)
    .style('stroke-dasharray', '8')
    .style('opacity', 0.4);

  // draw the ROC curves
  function drawCurve(data, tpr, stroke){

    svg.append('path')
      .attr('class', 'curve')
      .style('stroke', stroke)
      .attr('d', curve(data, tpr))
      .on('mouseover', d => {

        const areaID = `#${tpr}Area`;
        svg.select(areaID)
          .style('opacity', .4)

        const aucText = `.${tpr}text`; 
        svg.selectAll(aucText)
          .style('opacity', .9)
      })
      .on('mouseout', () => {
        const areaID = `#${tpr}Area`;
        svg.select(areaID)
          .style('opacity', 0)

        const aucText = `.${tpr}text`; 
        svg.selectAll(aucText)
          .style('opacity', 0)


      });
  }

  // draw the area under the ROC curves
  function drawArea(data, tpr, fill) {
    svg.append('path')
      .attr('class', 'area')
      .attr('id', `${tpr}Area`)
      .style('fill', fill)
      .style('opacity', 0)
      .attr('d', areaUnderCurve(data, tpr))
  }

  function drawAUCText(auc, tpr, label) {

    svg.append('g')
      .attr('class', `${tpr}text`)
      .style('opacity', 0)
      .attr('transform', `translate(${.5*width},${.79*height})`)
      .append('text')
        .text(label)
        .style({
          'fill': 'white',
          'font-size': 18
        });

    svg.append('g')
      .attr('class', `${tpr}text`)
      .style('opacity', 0)
      .attr('transform', `translate(${.5*width},${.84*height})`)
      .append('text')
        .text(`AUC = ${aucFormat(auc)}`)
        .style({
          'fill': 'white',
          'font-size': 18
        });

  }

  // calculate the area under each curve
  tprVariables.forEach(d => {
    const tpr = d.name;
    const points = generatePoints(data, fpr, tpr);
    const auc = calculateArea(points);
    d['auc'] = auc;
  })

  console.log('tprVariables', tprVariables);

  // draw curves, areas, and text for each 
  // true-positive rate in the data
  tprVariables.forEach((d, i) => {
    console.log('drawing the curve for', d.label)
    console.log('color(', i, ')', color(i));
    const tpr = d.name;
    drawArea(data, tpr, color(i))
    drawCurve(data, tpr, color(i));
    drawAUCText(d.auc, tpr, d.label);
  })

  ///////////////////////////////////////////////////
  ////// animate through areas for each curve ///////
  ///////////////////////////////////////////////////

  if(animate && animate !== 'false') {
    //sort tprVariables ascending by AUC
    const tprVariablesAscByAUC = tprVariables.sort((a, b) => a.auc - b.auc);

    console.log('tprVariablesAscByAUC', tprVariablesAscByAUC);
    
    for(let i = 0; i < tprVariablesAscByAUC.length; i++) {
      areaID = `#${tprVariablesAscByAUC[i]['name']}Area`;
      svg.select(areaID)
        .transition()
          .delay(2000 * (i+1))
          .duration(250)
          .style('opacity', .4)
        .transition()
          .delay(2000 * (i+2))
          .duration(250)
          .style('opacity', 0)

      textClass = `.${tprVariablesAscByAUC[i]['name']}text`;
      svg.selectAll(textClass)
        .transition()
          .delay(2000 * (i+1))
          .duration(250)
          .style('opacity', .9)
        .transition()
          .delay(2000 * (i+2))
          .duration(250)
          .style('opacity', 0)
    }  
  }

  ///////////////////////////////////////////////////
  ///////////////////////////////////////////////////
  ///////////////////////////////////////////////////

  function generatePoints(data, x, y) {
    const points = [];
    data.forEach(d => {
      points.push([ Number(d[x]), Number(d[y]) ])
    })
    return points;
  }

  // numerical integration
  function calculateArea(points) {
    let area = 0.0;
    const length = points.length;
    if (length <= 2) {
      return area;
    }
    points.forEach((d, i) => {
      const x = 0;
      const y = 1;

      if('undefined' !== typeof points[i-1]){
        area += (points[i][x] - points[i-1][x]) * (points[i-1][y] + points[i][y]) / 2;
      }
    });
    return area;
  }
} // rocChart




















