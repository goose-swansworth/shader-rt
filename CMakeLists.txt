cmake_minimum_required(VERSION 2.8)

project(shader-rt)

add_executable(../rt.out RayTracer_Shader.cpp)
find_package(OpenGL REQUIRED)
find_package(GLUT REQUIRED)
find_package(GLEW REQUIRED)

include_directories( ${OPENGL_INCLUDE_DIRS}  ${GLUT_INCLUDE_DIRS} ${GLEW_INCLUDE_DIRS} )

target_link_libraries(../rt.out ${OPENGL_LIBRARIES} ${GLUT_LIBRARY} ${GLEW_LIBRARIES} )

