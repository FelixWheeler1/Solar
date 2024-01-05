function orbiter(radius, speed, sunOrbit) {
    let x=0,y=0;
    if (sunOrbit == false)
    {
       earthPosition = planets.find(p => p.name === "Earth");
      x = earthPosition.mesh.position.x;
      y = earthPosition.mesh.position.z;
    }
     
    const curve = new THREE.EllipseCurve(
      x, y, //center x,y
      radius, radius,// radius x,y
      0, 2 * Math.PI //starts, ens angles (0,360 degrees)
    );
      //creat a geometry 
    const points = curve.getSpacedPoints(100);
    const geometryCurve = new THREE.BufferGeometry().setFromPoints(points);
  
     const time = speed * performance.now() //time in ms*value to slow orbit
    const t = (time % 1) / 1; //range from 0-1
  
    return curve.getPoint(t);
  }