using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class one_platform_trick : MonoBehaviour
{
    public GameObject player;
    public GameObject cube;
    private float distance;
    private bool trigger;
    private bool box_status;
    public float a;

    void Start()
    {
        box_status = cube.activeSelf;
        trigger = false;
    }
    void Update() 
    {
        distance = Vector3.Distance(player.transform.position, gameObject.transform.position);
        box_status = cube.activeSelf;
        if (trigger == false){
            if (distance <= a){
                if (box_status == false){
                    cube.SetActive(true);
                    box_status = true;
                }
                else if (box_status == true){
                    cube.SetActive(false);
                    box_status = false;
                }
                trigger = true;
            }
        }
        if (trigger == true){
            if (distance > a){
                trigger = false;
            }
        }
    }
}
