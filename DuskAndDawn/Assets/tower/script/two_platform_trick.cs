using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class two_platform_trick : MonoBehaviour
{
    public GameObject player;
    public GameObject cube_1;
    public GameObject cube_2;

    private float distance;
    private bool trigger_1;
    private bool box_1_status;
    private bool box_2_status;

    public float a;

    void Start()
    {
        trigger_1 = false;
        box_1_status = cube_1.activeSelf;
        print(box_1_status);
        box_2_status = cube_2.activeSelf;
        print(box_2_status);
    }
    void Update() 
    {
        distance = Vector3.Distance(player.transform.position, gameObject.transform.position);
        box_1_status = cube_1.activeSelf;
        box_2_status = cube_2.activeSelf;

        if (trigger_1 == false){
            if (distance <= a){
                if (box_1_status == false){
                    cube_1.SetActive(true);
                    box_1_status = true;
                }
                else if (box_1_status == true){
                    cube_1.SetActive(false);
                    box_1_status = false;
                }
                if (box_2_status == false){
                    cube_2.SetActive(true);
                    box_2_status = true;
                }
                else if (box_2_status == true){
                    cube_2.SetActive(false);
                    box_2_status = false;
                }                
                trigger_1 = true;
            }
        }
        if (trigger_1 == true){
            if (distance > a){
                trigger_1 = false;
            }
        }
    }
}
