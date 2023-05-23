#version 420

uniform float winWidth;
uniform float winHeight;
float eyeDist = 1200;
vec3 light = vec3(200, 300, -800);

out vec4 fragOutputColor;

struct Ray
{
	vec3 pos;
	vec3 dir;
	float t;
	int type;
	int index;
};	

Ray ray = Ray( vec3(0), vec3(0), -1, 0, 0 );

vec3 hit(Ray ray)
{
	return ray.pos + ray.t * ray.dir;
}


struct Sphere
{
	vec3 cen;
	float rad;
	vec3 col;
};


Sphere spheres[3] =
{
   { {0,  0, -1700},     200,  {0, 0, 1} },
   { {100, 120, -1400},   80,  {1, 0, 0} },  
   { {-100, -150, -1400}, 50,  {0, 1, 0} }
};


void sphereIntersection(inout Ray ray, int i)
{
    vec3 vdif = ray.pos - spheres[i].cen;
	float radius = spheres[i].rad;
    float b = dot(ray.dir, vdif);
    float len = length(vdif);
    float c = len*len - radius*radius;
    float delta = b*b - c;
 
	if(delta < 0.001) return;

    float t1 = -b - sqrt(delta);
    float t2 = -b + sqrt(delta);
	
    float hit;
	if (t1 < 0)
	{
		hit = (t2 > 0) ? t2 : -1;
	}
	else hit = t1;

	if ( (ray.t < 0  && hit > 0)
	  || (ray.t > 0  && hit < ray.t && hit > 0) )
    {
  	   ray.t = hit;
	   ray.type = 0;
	   ray.index = i;
	}
}
  
void closestPt(inout Ray ray)
{
	for(int i = 0; i < 3; i++)
	{
		sphereIntersection(ray, i);
	}
}


vec3 rayDirection()
{
    vec3 cellCentre = vec3(gl_FragCoord.x - winWidth/2,
						   gl_FragCoord.y - winHeight/2,
						   -eyeDist);
    return normalize(cellCentre);
}


vec3 lightingCol(vec3 posn, vec3 normal, vec3 lightVec, vec3 color)
{
   float nDotL = dot(normal, lightVec);
   vec3 ambientCol = 0.2 * color;
   if(nDotL < 0) return ambientCol;
   else
   {
 	   vec3 viewVec = - normalize(posn);
	   vec3 halfWayVec = normalize(lightVec + viewVec);
	   float nDotH = dot(normal, halfWayVec);
	   if (nDotH < 0) nDotH = 0;
	   vec3 diffuseCol = nDotL * color;
	   vec3 specularCol = pow(nDotH, 100) * vec3(1, 1, 1);  //shininess = 100
	   return ambientCol + diffuseCol + specularCol;
	}
}

vec3 trace(Ray ray)
{
   closestPt(ray);
   if (ray.t < 0) return vec3(0, 1, 1);  //background color
   
   vec3 color;
   vec3 posn = hit(ray);
   vec3 lightVec = light - posn;
   float lightDist = length(lightVec);
   lightVec = normalize(lightVec);
   vec3 posnStep = posn + 0.5 * lightVec;   //ray stepping
   Ray shadowRay = Ray( posnStep, lightVec, -1, 0, 0 );
   closestPt(shadowRay);
   color = spheres[ray.index].col;
   if (shadowRay.t > 0 && shadowRay.t < lightDist) color = 0.2 * color;
   else 
   {
      vec3 normal = posn - spheres[ray.index].cen;
	  normal = normalize(normal);
      color = lightingCol(posn, normal, lightVec, color);
   }
   return color;
}

void main()
{
	vec3 color;
	ray.dir = rayDirection();
	color = trace(ray);	
	fragOutputColor = vec4(color, 1);
}
