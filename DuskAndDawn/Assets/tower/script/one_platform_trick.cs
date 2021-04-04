﻿using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class one_platform_trick : MonoBehaviour
{
    public GameObject cube;

    public bool trigger;
    public bool box_status;
    public bool isAlwaysOn = false;

    void Start()
    {
        box_status = cube.activeSelf;
        trigger = false;
    }
    void Update() 
    {
        if (isAlwaysOn && box_status == true)
        {
            GetComponent<Collider>().enabled = false;
            GetComponent<MeshRenderer>().enabled = false;
        }
        
    }
    private void OnTriggerEnter(Collider other)
    {
        if (other.gameObject.name == gameObject.tag)
        {
            if (trigger == false)
            {
                if (box_status == false)
                {
                    cube.SetActive(true);
                    box_status = true;
                }
                else if (box_status == true)
                {
                    cube.SetActive(false);
                    box_status = false;
                }
                trigger = true;
            }
            if (gameObject.GetComponent<AudioSource>() != null)
            {
                gameObject.GetComponent<AudioSource>().PlayOneShot(gameObject.GetComponent<AudioSource>().clip);
            }
        }
    }

    private void OnTriggerExit(Collider other)
    {
        if (other.gameObject.name == gameObject.tag)
        {
            if (trigger == true)
            {
                trigger = false;
            }

        }
    }
}
