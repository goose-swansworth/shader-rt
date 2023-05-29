#version 420

uniform float winWidth;
uniform float winHeight;
float eyeDist = 1200;
vec3 light = vec3(200, 300, -800);
out vec4 fragOutputColor;
const int MAX_DEPTH = 5;
const int STACK_LIMIT = 100;
const uint SPHERE = 0;
const uint PLANE = 1;
int stack_index = -1;


struct Ray
{
	vec3 pos;
	vec3 dir;
	float t;
	int type;
	int index;
	int step;
};	

Ray ray = Ray( vec3(0), vec3(0), -1, 0, 0, 0);

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

struct Plane {
	vec3 point;
	vec3 normal;
	vec3 col;
};

vec3 rgb(float r, float g, float b) {
	return vec3(r / 255, g / 255, b / 255);
}


Sphere spheres[1] = {
   { {0,  0, -1700}, 150, rgb(112, 128, 144)}
};

Plane planes[1] = {
	{{0, -150, 0}, {0, 1, 0}, rgb(107, 142, 35)}
};

Ray ray_stack[STACK_LIMIT];

void stack_push(Ray ray) {
	if (stack_index + 1 < STACK_LIMIT) {
		stack_index++;
		ray_stack[stack_index] = ray;
	}
}

Ray stack_pop() {
	Ray ray = ray_stack[stack_index];
	stack_index--;
	return ray;
}


float sphereIntersection(Ray ray, int i)
{
    vec3 vdif = ray.pos - spheres[i].cen;
	float radius = spheres[i].rad;
    float b = dot(ray.dir, vdif);
    float len = length(vdif);
    float c = len*len - radius*radius;
    float delta = b*b - c;
 
	if(delta < 0.001) return -1;

    float t1 = -b - sqrt(delta);
    float t2 = -b + sqrt(delta);
	
    if (t1 < 0 && t2 < 0) {
		return -1;
	} else if (t1 > 0 && t2 < 0) {
		return t1;
	} else if (t1 < 0 && t2 > 0) {
		return t2;
	} else {
		return min(t1, t2);
	}
}

float plane_intersection(Ray ray, int i) {
	vec3 vdif = planes[i].point - ray.pos;
	float d_dot_n = dot(ray.dir, planes[i].normal);
	if (abs(d_dot_n) < 0.001) {
		return -1;
	} else {
		float t = dot(vdif, planes[i].normal) / d_dot_n;
		if (t < 0) {
			return -1;
		} else {
			return t;
		}
	}
}
  
void closestPt(inout Ray ray) {
	float closest = 100000;
	float t = -1;
	int index = -1;
	int type = -1;
	for (int i = 0; i < 1; i++) {
		t = sphereIntersection(ray, i);
		if (t > 0 && t < closest) {
			closest = t;
			index = i;
			type = 0;
		}
	}
	for (int j = 0; j < 1; j++) {
		t = plane_intersection(ray, j);
		if (t > 0 && t < closest) {
			closest = t;
			index = j;
			type = 1;
		}
	}
	ray.t = closest;
	ray.index = index;
	ray.type = type;
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

vec3 get_normal(int type, int index, vec3 posn) {
	vec3 normal;
	if (type == SPHERE)	{
		normal = posn - spheres[index].cen;
	} else {
		normal = planes[index].normal;
	}
	return normal;
}

vec3 lighting(vec3 posn) {
	vec3 color;
	vec3 lightVec = light - posn;
	float lightDist = length(lightVec);
	lightVec = normalize(lightVec);
	vec3 posnStep = posn + 0.5 * lightVec;   //ray stepping
	Ray shadowRay = Ray( posnStep, lightVec, -1, 0, 0, 0);
	closestPt(shadowRay);
	if (ray.type == 0) {
		color = spheres[ray.index].col;
	} else {
		color = planes[ray.index].col;
	}
	
	if (shadowRay.t > 0 && shadowRay.t < lightDist) {
		color = 0.2 * color;
	} else {
		vec3 normal = normalize(get_normal(ray.type, ray.index, posn));
		color = lightingCol(posn, normal, lightVec, color);
	}
	return color;
}

vec3 trace(Ray iray) {
	vec3 color;
	vec3 background = rgb(135, 206, 235);
	vec3 white = vec3(1, 1, 1);
	stack_push(iray);
	while (stack_index > -1) {
		ray = stack_pop();
		closestPt(ray);
		if (ray.index < 0) {
			float s = gl_FragCoord.y / winHeight;
			color = s * background + (1 - s) * white;
		} else {
			vec3 posn = hit(ray);
			color = lighting(posn);
		}
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
